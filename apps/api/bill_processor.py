# apps/api/bill_processor.py
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

import re
import urllib.request
import urllib.parse
import json
import os
import markdown
from typing import List, Dict, Tuple, Optional, Callable
from django.core.files.uploadedfile import UploadedFile
from dotenv import load_dotenv

load_dotenv()

# CivicAI Master Prompt - DO NOT MODIFY
CIVICAI_MASTER_PROMPT = """**Your Role and Goal:**
You are an AI legal analyst named **"CivicAI"** (Legal Assistant). Your single most important mission is to analyze the attached Kenyan Bill and summarize it for the average Kenyan citizen ("mwananchi"). Your goal is to break down complex legal language into a simple, clear, and neutral summary. You must empower the citizen with factual knowledge about how this bill could affect their life.

**Strict Rules You MUST Follow:**
1.  **Source Supremacy:** Your **ONLY** source of information is the provided document. Do NOT use any external knowledge, previous training data, or make any assumptions. Every point in your summary must be directly traceable to a clause in the bill.
2.  **No Hallucination:** Do not invent, infer, or guess any information, intentions, or outcomes not explicitly stated in the document.
3.  **Absolute Neutrality:** Do not provide any personal opinions, judgments, or analysis on whether the bill is "good" or "bad." Do not offer legal, financial, or any other form of advice. Your job is to report, not to interpret merit.

**Output Format and Structure:**
Please structure your summary using the following format precisely.

---

### **Summary of the [Official Title of the Bill]**

**1. What is the Main Goal of This Bill? (The Big Picture)**
(Provide a 1-2 sentence, high-level summary.)

**2. Key Points for the Kenyan Citizen ("Mwananchi")**
(Use clear subheadings and simple bullet points focusing on direct impact.)

* **How It Affects Your Money (Taxes, Levies, and Fees):**
* **Changes to Your Rights and Daily Life:**
* **New Government Powers and Agencies:**
* **New Fines and Penalties:**
make sure you talk numbers, figures statistic etc if and only if where provided eg
a guarantee for any form of indebtedness by one person to the other
person constitutes not less than seventy per cent of the total
indebtedness of the other person excluding guarantee from financial
institutions where the person and the financial institution are not
associated, you will not the 70% and pass it in the summary

**3. Important Terms Explained**
(Identify 3-5 critical terms from the bill and define them in simple language.)

**Disclaimer:**
This is a simplified summary based solely on the text of the bill provided. It is for informational purposes only and is not legal advice."""

def extract_pdf_text_with_progress(uploaded_file: UploadedFile, progress_callback: Optional[Callable] = None) -> Tuple[str, int]:
    """
    Extract text from PDF with progress updates
    Args:
        uploaded_file: Django UploadedFile object
        progress_callback: Optional function(stage: str, percentage: int, message: str)
    Returns:
        tuple: (extracted_text: str, page_count: int)
    """
    try:
        if not PyPDF2:
            raise ImportError("PyPDF2 not available")
        
        if progress_callback:
            progress_callback('extracting', 10, 'Starting PDF text extraction...')
        
        reader = PyPDF2.PdfReader(uploaded_file)
        page_count = len(reader.pages)
        text = ''
        
        if progress_callback:
            progress_callback('extracting', 20, f'Found {page_count} pages. Extracting text...')
        
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ''
            text += page_text + '\n'
            
            # Update progress for every 10 pages or at end
            if progress_callback and (i % 10 == 0 or i == page_count - 1):
                percentage = 20 + int((i + 1) / page_count * 30)  # 20-50% range
                progress_callback('extracting', percentage, f'Extracted page {i + 1} of {page_count}')
        
        if progress_callback:
            progress_callback('extracting', 50, f'Text extraction complete. {len(text)} characters extracted.')
        
        return text, page_count
        
    except Exception as e:
        if progress_callback:
            progress_callback('extracting', 0, f'PDF extraction failed: {str(e)}')
        raise Exception(f"PDF text extraction failed: {str(e)}")


def detect_bill_sections(text: str) -> List[Dict]:
    """
    Detect bill structure and create logical sections
    Args:
        text: Full bill text string
    Returns:
        list[dict]: [{'title': str, 'content': str, 'start_pos': int, 'end_pos': int}, ...]
    """
    sections = []
    
    # Common Kenyan bill section patterns
    section_patterns = [
        r'(?i)^(PART\s+[IVX]+[A-Z]*)\s*[:\-]?\s*(.*)$',  # PART I, PART II, etc.
        r'(?i)^(SECTION\s+\d+)\s*[:\-]?\s*(.*)$',        # SECTION 1, SECTION 2, etc.
        r'(?i)^(\d+\.\s*)(.*)$',                         # 1. Title, 2. Title, etc.
        r'(?i)^(SCHEDULE\s*[A-Z0-9]*)\s*[:\-]?\s*(.*)$', # SCHEDULE A, SCHEDULE 1, etc.
        r'(?i)^(PREAMBLE|WHEREAS|ARRANGEMENT OF SECTIONS|INTERPRETATION|DEFINITIONS|COMMENCEMENT)',
    ]
    
    lines = text.split('\n')
    current_section = {'title': 'Introduction', 'content': '', 'start_pos': 0}
    current_pos = 0
    
    for line_num, line in enumerate(lines):
        line = line.strip()
        if not line:
            current_section['content'] += '\n'
            current_pos += 1
            continue
        
        # Check if line matches any section pattern
        is_section_header = False
        section_title = None
        
        for pattern in section_patterns:
            match = re.match(pattern, line)
            if match:
                is_section_header = True
                if len(match.groups()) >= 2:
                    section_title = f"{match.group(1)} {match.group(2)}".strip()
                else:
                    section_title = match.group(1).strip()
                break
        
        # If we found a new section header and have accumulated content
        if is_section_header and current_section['content'].strip():
            current_section['end_pos'] = current_pos
            sections.append(current_section.copy())
            
            # Start new section
            current_section = {
                'title': section_title or line,
                'content': '',
                'start_pos': current_pos
            }
        else:
            # Add line to current section
            current_section['content'] += line + '\n'
        
        current_pos += len(line) + 1
    
    # Add the last section
    if current_section['content'].strip():
        current_section['end_pos'] = current_pos
        sections.append(current_section)
    
    # If no sections were detected, treat entire document as one section
    if not sections:
        sections = [{
            'title': 'Complete Bill',
            'content': text,
            'start_pos': 0,
            'end_pos': len(text)
        }]
    
    return sections


def apply_civicai_prompt_to_section(section_content: str, section_title: str) -> str:
    """
    Apply CivicAI master prompt to single section
    Args:
        section_content: Text content of the section
        section_title: Name/title of the section
    Returns:
        str: Processed markdown content following CivicAI format
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return f"**{section_title}**\n\n{section_content[:1000]}...\n\n*Note: AI processing unavailable - API key not configured.*"
        
        # Limit section content to avoid token limits
        limited_content = section_content[:8000] if len(section_content) > 8000 else section_content
        
        # Build the prompt with section context
        full_prompt = f"{CIVICAI_MASTER_PROMPT}\n\nSection to analyze: {section_title}\n\nSection content:\n{limited_content}"
        
        data = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "user", "content": full_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1500
        }
        
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(data).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                result = json.loads(response.read().decode('utf-8'))
                return result['choices'][0]['message']['content']
            else:
                return f"**{section_title}**\n\n{section_content[:1000]}...\n\n*Note: AI processing failed with status {response.status}.*"
                
    except Exception as e:
        return f"**{section_title}**\n\n{section_content[:1000]}...\n\n*Note: AI processing error - {str(e)}*"


def markdown_to_html(markdown_text: str) -> str:
    """
    Convert markdown to HTML for frontend display
    Args:
        markdown_text: Raw markdown string
    Returns:
        str: HTML formatted text
    """
    try:
        # Configure markdown with extensions for better formatting
        md = markdown.Markdown(
            extensions=['markdown.extensions.tables', 'markdown.extensions.nl2br'],
            extension_configs={
                'markdown.extensions.nl2br': {'newlines': True}
            }
        )
        
        # Convert to HTML
        html_content = md.convert(markdown_text)
        
        # Add basic styling classes for CivicAI formatting
        html_content = html_content.replace('<h3>', '<h3 class="civicai-section-title">')
        html_content = html_content.replace('<h4>', '<h4 class="civicai-subsection">')
        html_content = html_content.replace('<ul>', '<ul class="civicai-list">')
        html_content = html_content.replace('<ol>', '<ol class="civicai-numbered-list">')
        html_content = html_content.replace('<p>', '<p class="civicai-paragraph">')
        
        return html_content
        
    except Exception as e:
        # Fallback: basic HTML conversion
        html_content = markdown_text.replace('\n\n', '</p><p>')
        html_content = html_content.replace('###', '<h3>').replace('**', '<strong>').replace('*', '<em>')
        return f'<p>{html_content}</p>'


def combine_sections_to_final_summary(processed_sections: List[str]) -> Tuple[str, str]:
    """
    Combine processed sections into final summary
    Args:
        processed_sections: List of processed section markdown content
    Returns:
        tuple: (final_markdown: str, final_html: str)
    """
    # Combine all sections with separators
    final_markdown = '\n\n---\n\n'.join(processed_sections)
    
    # Add header if multiple sections
    if len(processed_sections) > 1:
        header = "# CivicAI Bill Analysis\n\n*This summary combines analysis from multiple bill sections.*\n\n"
        final_markdown = header + final_markdown
    
    # Convert to HTML
    final_html = markdown_to_html(final_markdown)
    
    return final_markdown, final_html


def summarize_bill_document_enhanced(uploaded_file: UploadedFile, bill_id: Optional[str] = None, progress_callback: Optional[Callable] = None) -> Dict:
    """
    Enhanced bill processing with progress tracking and HTML output
    Args:
        uploaded_file: Django UploadedFile object
        bill_id: Optional UUID string for progress tracking
        progress_callback: Optional function(stage, percentage, message)
    Returns:
        dict: {
            'success': bool,
            'summary_markdown': str,
            'summary_html': str,
            'sections_count': int,
            'error': str (if failed)
        }
    """
    try:
        if progress_callback:
            progress_callback('extracting', 5, 'Starting enhanced bill processing...')
        
        # Step 1: Extract text with progress
        text, page_count = extract_pdf_text_with_progress(uploaded_file, progress_callback)
        
        if not text.strip():
            return {
                'success': False,
                'summary_markdown': '',
                'summary_html': '',
                'sections_count': 0,
                'error': 'No text could be extracted from PDF'
            }
        
        if progress_callback:
            progress_callback('analyzing', 55, 'Analyzing document structure...')
        
        # Step 2: Detect sections
        sections = detect_bill_sections(text)
        sections_count = len(sections)
        
        if progress_callback:
            progress_callback('sectioning', 60, f'Identified {sections_count} sections for processing...')
        
        # Step 3: Process sections with AI
        processed_sections = []
        
        for i, section in enumerate(sections):
            if progress_callback:
                section_progress = 60 + int((i / sections_count) * 25)  # 60-85% range
                progress_callback('processing', section_progress, f'Processing section {i+1} of {sections_count}: {section["title"][:50]}...')
            
            # Apply CivicAI prompt to section
            processed_content = apply_civicai_prompt_to_section(section['content'], section['title'])
            processed_sections.append(processed_content)
        
        if progress_callback:
            progress_callback('formatting', 90, 'Combining sections and formatting output...')
        
        # Step 4: Combine sections and create final output
        final_markdown, final_html = combine_sections_to_final_summary(processed_sections)
        
        if progress_callback:
            progress_callback('completing', 95, 'Finalizing summary...')
        
        return {
            'success': True,
            'summary_markdown': final_markdown,
            'summary_html': final_html,
            'sections_count': sections_count,
            'error': None
        }
        
    except Exception as e:
        error_msg = f"Enhanced processing failed: {str(e)}"
        if progress_callback:
            progress_callback('failed', 0, error_msg)
        
        return {
            'success': False,
            'summary_markdown': '',
            'summary_html': '',
            'sections_count': 0,
            'error': error_msg
        }


def create_bill_chunks(text: str, bill_instance, max_chunk_size: int = 2000) -> int:
    """
    Create BillChunk objects for future chat functionality
    Args:
        text: Full bill text
        bill_instance: Bill model instance
        max_chunk_size: Maximum characters per chunk
    Returns:
        int: Number of chunks created
    """
    from apps.projects.models import BillChunk
    
    # Clear existing chunks
    BillChunk.objects.filter(bill=bill_instance).delete()
    
    # Detect sections first
    sections = detect_bill_sections(text)
    chunks_created = 0
    
    for section in sections:
        section_content = section['content']
        section_title = section['title']
        
        # If section is small enough, create one chunk
        if len(section_content) <= max_chunk_size:
            BillChunk.objects.create(
                bill=bill_instance,
                chunk_index=chunks_created,
                section_title=section_title,
                content=section_content,
                start_position=section['start_pos'],
                end_position=section['end_pos']
            )
            chunks_created += 1
        else:
            # Split large sections into multiple chunks
            words = section_content.split()
            current_chunk = ''
            chunk_start_pos = section['start_pos']
            
            for word in words:
                if len(current_chunk + word) > max_chunk_size and current_chunk:
                    # Create chunk
                    chunk_end_pos = chunk_start_pos + len(current_chunk)
                    BillChunk.objects.create(
                        bill=bill_instance,
                        chunk_index=chunks_created,
                        section_title=f"{section_title} (Part {chunks_created + 1})",
                        content=current_chunk.strip(),
                        start_position=chunk_start_pos,
                        end_position=chunk_end_pos
                    )
                    chunks_created += 1
                    chunk_start_pos = chunk_end_pos
                    current_chunk = word + ' '
                else:
                    current_chunk += word + ' '
            
            # Create final chunk if remaining content
            if current_chunk.strip():
                BillChunk.objects.create(
                    bill=bill_instance,
                    chunk_index=chunks_created,
                    section_title=f"{section_title} (Part {chunks_created + 1})",
                    content=current_chunk.strip(),
                    start_position=chunk_start_pos,
                    end_position=section['end_pos']
                )
                chunks_created += 1
    
    return chunks_created


def validate_summary_quality(summary_text: str) -> Dict[str, bool]:
    """
    Validate that generated summary meets CivicAI quality standards
    Args:
        summary_text: Generated summary text
    Returns:
        dict: Quality validation results
    """
    validation = {
        'has_title': '### **Summary of' in summary_text,
        'has_main_goal': 'What is the Main Goal' in summary_text,
        'has_key_points': 'Key Points for the Kenyan Citizen' in summary_text,
        'has_money_section': 'How It Affects Your Money' in summary_text,
        'has_rights_section': 'Changes to Your Rights' in summary_text,
        'has_terms_section': 'Important Terms Explained' in summary_text,
        'has_disclaimer': 'This is a simplified summary' in summary_text,
        'min_length': len(summary_text) > 200,
        'not_error_message': 'AI processing' not in summary_text.lower() or 'failed' not in summary_text.lower()
    }
    
    validation['overall_quality'] = sum(validation.values()) >= 7  # At least 7/9 checks pass
    
    return validation