# apps/api/bulletproof_processor.py
import os
import json
import time
import psutil
import urllib.request
from typing import List, Dict, Tuple, Optional, Callable
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import logging

logger = logging.getLogger(__name__)

@dataclass
class ProcessingLimits:
    """Resource and time limits for bulletproof processing"""
    max_processing_time: int = 600  # 10 minutes total
    max_memory_percent: float = 85.0  # 85% of system memory
    max_groups: int = 15  # Maximum number of groups
    max_group_size: int = 20  # Maximum chunks per group
    max_content_per_group: int = 15000  # Maximum characters per group
    group_timeout: int = 45  # Timeout per group processing
    max_retries: int = 2  # Retry attempts per group

@dataclass
class ProcessingMetrics:
    """Track processing metrics and performance"""
    start_time: float
    chunks_created: int = 0
    groups_created: int = 0
    groups_processed: int = 0
    groups_failed: int = 0
    fallbacks_used: int = 0
    total_api_calls: int = 0
    memory_peak: float = 0.0
    
    @property
    def elapsed_time(self) -> float:
        return time.time() - self.start_time
    
    @property
    def current_memory_percent(self) -> float:
        return psutil.virtual_memory().percent

class ProcessingException(Exception):
    """Custom exception for processing failures"""
    pass

class ResourceExhaustedException(ProcessingException):
    """Raised when system resources are exhausted"""
    pass

class TimeoutException(ProcessingException):
    """Raised when processing exceeds time limits"""
    pass

def check_system_resources(limits: ProcessingLimits, metrics: ProcessingMetrics) -> None:
    """
    Check system resources and raise exceptions if limits exceeded
    
    Args:
        limits: Processing limits configuration
        metrics: Current processing metrics
    
    Raises:
        ResourceExhaustedException: If memory limit exceeded
        TimeoutException: If time limit exceeded
    """
    # Check memory usage
    current_memory = metrics.current_memory_percent
    if current_memory > limits.max_memory_percent:
        raise ResourceExhaustedException(
            f"Memory usage {current_memory:.1f}% exceeds limit {limits.max_memory_percent}%"
        )
    
    # Track peak memory
    metrics.memory_peak = max(metrics.memory_peak, current_memory)
    
    # Check processing time
    if metrics.elapsed_time > limits.max_processing_time:
        raise TimeoutException(
            f"Processing time {metrics.elapsed_time:.1f}s exceeds limit {limits.max_processing_time}s"
        )

def create_chunks_from_text(text: str, max_chunks: int = 300) -> List[Dict]:
    """
    Create chunks from text with smart section detection
    
    Args:
        text: Full document text
        max_chunks: Maximum number of chunks to create
    
    Returns:
        List of chunk dictionaries
    """
    from .bill_processor import detect_bill_sections
    
    sections = detect_bill_sections(text)
    chunks = []
    chunk_id = 0
    
    for section in sections:
        section_content = section['content'].strip()
        if not section_content:
            continue
        
        # If section is small enough, create one chunk
        if len(section_content) <= 2000:
            chunks.append({
                'id': chunk_id,
                'section_title': section['title'],
                'content': section_content,
                'character_count': len(section_content),
                'start_position': section['start_pos'],
                'end_position': section['end_pos']
            })
            chunk_id += 1
        else:
            # Split large sections into smaller chunks
            words = section_content.split()
            current_chunk = ''
            word_start = 0
            
            for i, word in enumerate(words):
                if len(current_chunk + word + ' ') > 2000 and current_chunk:
                    chunks.append({
                        'id': chunk_id,
                        'section_title': f"{section['title']} (Part {chunk_id - len([c for c in chunks if c['section_title'].startswith(section['title'])]) + 1})",
                        'content': current_chunk.strip(),
                        'character_count': len(current_chunk),
                        'start_position': section['start_pos'] + word_start,
                        'end_position': section['start_pos'] + word_start + len(current_chunk)
                    })
                    chunk_id += 1
                    current_chunk = ''
                    word_start = i
                
                current_chunk += word + ' '
                
                # Stop if we've reached max chunks
                if chunk_id >= max_chunks:
                    break
            
            # Add remaining content
            if current_chunk.strip() and chunk_id < max_chunks:
                chunks.append({
                    'id': chunk_id,
                    'section_title': f"{section['title']} (Part {chunk_id - len([c for c in chunks if c['section_title'].startswith(section['title'])]) + 1})",
                    'content': current_chunk.strip(),
                    'character_count': len(current_chunk),
                    'start_position': section['start_pos'] + word_start,
                    'end_position': section['end_pos']
                })
                chunk_id += 1
        
        if chunk_id >= max_chunks:
            break
    
    logger.info(f"Created {len(chunks)} chunks from document")
    return chunks

def group_chunks_intelligently(chunks: List[Dict], limits: ProcessingLimits) -> List[Dict]:
    """
    Group chunks into logical processing units
    
    Args:
        chunks: List of chunks to group
        limits: Processing limits
    
    Returns:
        List of chunk groups
    """
    if not chunks:
        return []
    
    groups = []
    current_group = {
        'id': 0,
        'title': chunks[0]['section_title'].split(' (Part')[0],  # Remove part numbers
        'chunks': [],
        'total_characters': 0,
        'section_titles': set()
    }
    
    for chunk in chunks:
        base_section = chunk['section_title'].split(' (Part')[0]
        
        # Start new group if:
        # 1. Too many chunks in current group
        # 2. Too much content in current group  
        # 3. Different section and current group has content
        should_start_new = (
            len(current_group['chunks']) >= limits.max_group_size or
            current_group['total_characters'] + chunk['character_count'] > limits.max_content_per_group or
            (base_section != current_group['title'] and len(current_group['chunks']) > 0)
        )
        
        if should_start_new and len(groups) < limits.max_groups - 1:
            groups.append(current_group)
            current_group = {
                'id': len(groups),
                'title': base_section,
                'chunks': [],
                'total_characters': 0,
                'section_titles': set()
            }
        
        current_group['chunks'].append(chunk)
        current_group['total_characters'] += chunk['character_count']
        current_group['section_titles'].add(base_section)
    
    # Add final group
    if current_group['chunks']:
        groups.append(current_group)
    
    # Optimize groups - merge small ones, split large ones
    optimized_groups = optimize_groups(groups, limits)
    
    logger.info(f"Created {len(optimized_groups)} intelligent groups from {len(chunks)} chunks")
    return optimized_groups

def optimize_groups(groups: List[Dict], limits: ProcessingLimits) -> List[Dict]:
    """
    Optimize groups by merging small ones and splitting large ones
    """
    if len(groups) <= 1:
        return groups
    
    optimized = []
    i = 0
    
    while i < len(groups):
        current_group = groups[i]
        
        # If group is too small and we can merge with next
        if (i + 1 < len(groups) and 
            len(current_group['chunks']) < 5 and
            len(optimized) < limits.max_groups - 1):
            
            next_group = groups[i + 1]
            if (current_group['total_characters'] + next_group['total_characters'] 
                <= limits.max_content_per_group):
                
                # Merge groups
                merged_group = {
                    'id': len(optimized),
                    'title': f"{current_group['title']} & {next_group['title']}"[:100],
                    'chunks': current_group['chunks'] + next_group['chunks'],
                    'total_characters': current_group['total_characters'] + next_group['total_characters'],
                    'section_titles': current_group['section_titles'].union(next_group['section_titles'])
                }
                optimized.append(merged_group)
                i += 2  # Skip next group as it's merged
                continue
        
        optimized.append(current_group)
        i += 1
    
    return optimized

def generate_group_summary_with_fallback(group: Dict, limits: ProcessingLimits, metrics: ProcessingMetrics) -> str:
    """
    Generate summary for a group with multiple fallback strategies
    
    Args:
        group: Group to process
        limits: Processing limits
        metrics: Processing metrics
    
    Returns:
        Generated summary text
    """
    group_title = group['title']
    
    # Strategy 1: Try OpenAI with full content
    try:
        return generate_group_summary_openai(group, limits.group_timeout)
    except Exception as e:
        logger.warning(f"OpenAI processing failed for group '{group_title}': {str(e)}")
        metrics.groups_failed += 1
    
    # Strategy 2: Try with reduced content
    try:
        reduced_group = reduce_group_content(group, max_chars=8000)
        return generate_group_summary_openai(reduced_group, limits.group_timeout // 2)
    except Exception as e:
        logger.warning(f"Reduced OpenAI processing failed for group '{group_title}': {str(e)}")
    
    # Strategy 3: Fallback to template-based summary
    try:
        return generate_template_summary(group)
    except Exception as e:
        logger.error(f"Template processing failed for group '{group_title}': {str(e)}")
    
    # Strategy 4: Emergency fallback
    metrics.fallbacks_used += 1
    return generate_emergency_summary(group)


# Updated section for apps/api/bulletproof_processor.py
# Replace the generate_group_summary_openai() function with this optimized version

def generate_group_summary_openai(group: Dict, timeout: int) -> str:
    """
    Generate group summary using standardized citizen-focused prompts
    
    Args:
        group: Group to process
        timeout: Processing timeout
    
    Returns:
        Generated summary text
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ProcessingException("OpenAI API key not available")
    
    # Import standardized prompt system
    from .citizen_chat_prompts import create_section_summary_prompt, DISCLAIMERS
    
    # Combine group content efficiently
    combined_content = combine_group_content(group, max_length=8000)  # Reduced for speed
    
    # Use standardized section summary prompt
    standardized_prompt = create_section_summary_prompt(
        section_title=group['title'],
        section_content=combined_content,
        focus_area='citizen_impact'
    )
    
    # Add specific instructions for bill processing context
    enhanced_prompt = f"""You are CivicAI processing a section of a Kenyan bill for citizen understanding.

{standardized_prompt}

ADDITIONAL CONTEXT FOR BILL PROCESSING:
- This is part of automated bill processing for the CivicAI platform
- Citizens will read this summary to understand how the bill affects them
- Focus on practical, actionable information
- Be concise but comprehensive
- Maximum should be about be a minimum of 10% of the content increasing with decrease in content volume

CRITICAL REQUIREMENTS:
1. Use simple Kenyan English that any citizen can understand
2. Focus on practical impacts: money, rights, obligations, deadlines
3. Include specific amounts, percentages, dates if mentioned in the content
4. Explain penalties and enforcement clearly
5. Structure with clear headings and bullet points
6. End with appropriate disclaimer

Remember: This summary will help ordinary Kenyans ("wananchi") understand their government better."""

    # Optimized API call with faster model and reduced tokens
    data = {
        "model": "gpt-4o-mini",  # Faster than gpt-4
        "messages": [
            {
                "role": "system", 
                "content": "You are CivicAI, helping Kenyans understand government legislation in simple terms."
            },
            {
                "role": "user", 
                "content": enhanced_prompt
            }
        ],
        "temperature": 0.2,  # Lower for consistency and speed
        "max_tokens": 350,   # Reduced from 400 for speed
        "top_p": 0.9        # Added for better quality/speed balance
    }
    
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(data).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=min(timeout, 20)) as response:  # Cap timeout at 20s
            if response.status == 200:
                result = json.loads(response.read().decode('utf-8'))
                summary_content = result['choices'][0]['message']['content']
                
                # Add standardized disclaimer
                disclaimer = DISCLAIMERS['standard']
                
                # Ensure proper formatting
                if not summary_content.endswith('\n'):
                    summary_content += '\n'
                
                return f"{summary_content}\n*{disclaimer}*"
            else:
                raise ProcessingException(f"OpenAI API returned status {response.status}")
                
    except Exception as e:
        logger.error(f"OpenAI API call failed: {str(e)}")
        raise ProcessingException(f"OpenAI processing failed: {str(e)}")


# Also update the combine_group_content function for better performance
def combine_group_content(group: Dict, max_length: int = 8000) -> str:
    """
    Efficiently combine content from group chunks with performance optimization
    
    Args:
        group: Group containing chunks
        max_length: Maximum content length (reduced for speed)
    
    Returns:
        Combined content string
    """
    if not group['chunks']:
        return ""
    
    # Performance optimization: prioritize first chunks and unique sections
    seen_sections = set()
    priority_chunks = []
    
    # First pass: get unique sections and prioritize beginning content
    for chunk in group['chunks']:
        section_base = chunk['section_title'].split(' (Part')[0]
        if section_base not in seen_sections or len(priority_chunks) < 3:
            priority_chunks.append(chunk)
            seen_sections.add(section_base)
    
    # Build content efficiently
    combined_parts = []
    current_length = 0
    
    for chunk in priority_chunks:
        section_header = f"\n=== {chunk['section_title']} ===\n"
        chunk_content = chunk['content'].strip()
        
        # Calculate what we can fit
        available_space = max_length - current_length - len(section_header) - 100  # Buffer
        
        if available_space < 200:  # Not enough space for meaningful content
            break
            
        # Truncate content if necessary
        if len(chunk_content) > available_space:
            # Find last complete sentence within limit
            truncated = chunk_content[:available_space]
            last_period = truncated.rfind('.')
            if last_period > available_space * 0.7:  # If we have at least 70% of content
                chunk_content = truncated[:last_period + 1] + " [...]"
            else:
                chunk_content = truncated + "..."
        
        section_text = section_header + chunk_content
        combined_parts.append(section_text)
        current_length += len(section_text)
        
        if current_length >= max_length * 0.9:  # Stop at 90% to leave room for final formatting
            break
    
    return '\n'.join(combined_parts)


# Performance monitoring function (optional - for debugging)
def log_processing_performance(group_title: str, start_time: float, api_call_time: float, tokens_used: int):
    """Log performance metrics for optimization"""
    total_time = time.time() - start_time
    
    logger.info(f"📊 Group Processing Performance:")
    logger.info(f"   Group: {group_title[:50]}...")
    logger.info(f"   Total Time: {total_time:.2f}s")
    logger.info(f"   API Call Time: {api_call_time:.2f}s") 
    logger.info(f"   Tokens Used: {tokens_used}")
    logger.info(f"   Efficiency: {tokens_used/api_call_time:.1f} tokens/sec")
    

def reduce_group_content(group: Dict, max_chars: int) -> Dict:
    """
    Reduce group content by selecting most important chunks
    """
    if group['total_characters'] <= max_chars:
        return group
    
    # Select chunks by importance (start of sections, shorter chunks)
    chunks = sorted(group['chunks'], key=lambda x: (
        0 if "Part 1" in x['section_title'] or x['section_title'] == group['title'] else 1,
        len(x['content'])
    ))
    
    selected_chunks = []
    total_chars = 0
    
    for chunk in chunks:
        if total_chars + chunk['character_count'] <= max_chars:
            selected_chunks.append(chunk)
            total_chars += chunk['character_count']
    
    return {
        **group,
        'chunks': selected_chunks,
        'total_characters': total_chars
    }

def generate_template_summary(group: Dict) -> str:
    """
    Generate summary using template-based approach (no AI)
    """
    title = group['title']
    chunk_count = len(group['chunks'])
    
    # Extract key information using patterns
    content_sample = ' '.join([chunk['content'] for chunk in group['chunks'][:3]])
    
    # Look for key patterns
    money_patterns = ['shilling', 'tax', 'fee', 'cost', 'fine', 'penalty', 'amount']
    rights_patterns = ['right', 'shall', 'entitled', 'may', 'citizen']
    
    money_mentions = sum(1 for pattern in money_patterns if pattern.lower() in content_sample.lower())
    rights_mentions = sum(1 for pattern in rights_patterns if pattern.lower() in content_sample.lower())
    
    template = f"""**{title}**

This section contains {chunk_count} provisions covering various aspects of the bill.

- **Content Focus:** {'Financial provisions' if money_mentions > rights_mentions else 'Rights and procedures'}
- **Key Areas:** {', '.join(list(group['section_titles'])[:3])}
- **Citizen Impact:** This section establishes rules and procedures that may affect how citizens interact with government services.

*Note: This is a template-based summary. For detailed information, refer to the full bill text.*
"""
    
    return template

def generate_emergency_summary(group: Dict) -> str:
    """
    Emergency fallback summary (always works)
    """
    return f"""**{group['title']}**

This section of the bill contains {len(group['chunks'])} provisions. Due to processing limitations, a detailed summary is not available at this time.

Key sections included: {', '.join(list(group['section_titles'])[:3])}

*For complete information, please refer to the original bill document.*
"""

def combine_group_summaries(group_summaries: List[str], bill_title: str = "Kenyan Bill") -> str:
    """
    Combine group summaries into final comprehensive summary
    """
    if not group_summaries:
        return "**Summary unavailable**\n\nNo content could be processed."
    
    header = f"""### **Summary of {bill_title}**

**What is the Main Goal of This Bill?**
This bill introduces comprehensive legislation affecting various aspects of citizen life, government procedures, and legal requirements in Kenya.

**Key Sections:**

"""
    
    combined_sections = '\n\n'.join(group_summaries)
    
    footer = f"""

**Important Notice:**
This summary is based on {len(group_summaries)} major sections of the bill and is provided for educational purposes only. For legal advice, consult a qualified professional.

*Generated using intelligent section analysis for citizen understanding.*
"""
    
    return header + combined_sections + footer

# Helper functions for system monitoring
def get_memory_usage() -> float:
    """Get current memory usage percentage"""
    return psutil.virtual_memory().percent

def get_processing_time(start_time: float) -> float:
    """Get elapsed processing time"""
    return time.time() - start_time

# def generate_group_summary_openai(group: Dict, timeout: int) -> str:
#     """
#     Generate group summary using OpenAI API
#     """
#     api_key = os.getenv("OPENAI_API_KEY")
#     if not api_key:
#         raise ProcessingException("OpenAI API key not available")
    
#     # Combine group content intelligently
#     combined_content = combine_group_content(group)
    
#     prompt = f"""Analyze this section of a Kenyan bill and provide a concise summary for citizens.

# **Section:** {group['title']}

# **Instructions:**
# 1. Focus on citizen impact (money, rights, obligations, penalties)
# 2. Include specific amounts/percentages if mentioned
# 3. Use simple language
# 4. Maximum 200 words

# **Content:**
# {combined_content}

# **Format:**
# **{group['title']}**
# - How it affects citizens: [key impacts]
# - Money matters: [costs, fees, taxes]
# - Important details: [specific provisions]
# """

#     data = {
#         "model": "gpt-4o-mini",
#         "messages": [{"role": "user", "content": prompt}],
#         "temperature": 0.3,
#         "max_tokens": 400
#     }
    
#     req = urllib.request.Request(
#         "https://api.openai.com/v1/chat/completions",
#         data=json.dumps(data).encode('utf-8'),
#         headers={
#             "Authorization": f"Bearer {api_key}",
#             "Content-Type": "application/json"
#         }
#     )
    
#     with urllib.request.urlopen(req, timeout=timeout) as response:
#         if response.status == 200:
#             result = json.loads(response.read().decode('utf-8'))
#             return result['choices'][0]['message']['content']
#         else:
#             raise ProcessingException(f"OpenAI API returned status {response.status}")

# def combine_group_content(group: Dict, max_length: int = 12000) -> str:
#     """
#     Intelligently combine content from group chunks
#     """
#     if not group['chunks']:
#         return ""
    
#     # Start with most important chunks (beginning of sections)
#     sorted_chunks = sorted(group['chunks'], key=lambda x: (x['section_title'], x['id']))
    
#     combined = ""
#     for chunk in sorted_chunks:
#         chunk_content = f"\n--- {chunk['section_title']} ---\n{chunk['content']}\n"
        
#         if len(combined + chunk_content) > max_length:
#             # Add truncated version if we're running out of space
#             remaining_space = max_length - len(combined) - 100
#             if remaining_space > 200:
#                 combined += f"\n--- {chunk['section_title']} ---\n{chunk['content'][:remaining_space]}...\n"
#             break
        
#         combined += chunk_content
    
#     return combined