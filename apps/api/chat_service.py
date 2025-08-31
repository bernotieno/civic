# apps/api/chat_service.py
import re
import asyncio
from typing import List, Dict, Tuple, Optional
from django.db.models import Q
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from apps.projects.models import Bill, BillChunk
from apps.ai.services.llm_client import llm_client
from .citizen_chat_prompts import (
    CITIZEN_CHAT_SYSTEM_PROMPT,
    create_citizen_chat_prompt,
    create_follow_up_prompt,
    get_appropriate_disclaimer
)
import logging

logger = logging.getLogger(__name__)


def validate_chat_question(question: str, bill_id: str) -> Dict:
    """
    Validate user question is appropriate and answerable
    Args:
        question: User's question
        bill_id: Bill UUID string
    Returns:
        dict: {
            'valid': bool,
            'reason': str,
            'suggestions': list[str]
        }
    """
    try:
        # Basic validation
        if not question or not question.strip():
            return {
                'valid': False,
                'reason': 'Question cannot be empty',
                'suggestions': ['Please ask a specific question about the bill']
            }
        
        question = question.strip()
        
        # Length validation
        if len(question) < 5:
            return {
                'valid': False,
                'reason': 'Question is too short',
                'suggestions': [
                    'Please provide more details in your question',
                    'Try asking about specific aspects of the bill'
                ]
            }
        
        if len(question) > 500:
            return {
                'valid': False,
                'reason': 'Question is too long',
                'suggestions': [
                    'Please keep your question under 500 characters',
                    'Try breaking down complex questions into simpler ones'
                ]
            }
        
        # Check for inappropriate content
        inappropriate_keywords = [
            'hack', 'exploit', 'manipulate', 'illegal', 'violence',
            'personal information', 'confidential', 'classified'
        ]
        
        question_lower = question.lower()
        for keyword in inappropriate_keywords:
            if keyword in question_lower:
                return {
                    'valid': False,
                    'reason': 'Question contains inappropriate content',
                    'suggestions': [
                        'Please ask questions about the bill content only',
                        'Focus on how the bill affects citizens'
                    ]
                }
        
        # Check for nonsensical input (repeated characters, gibberish)
        # Count unique characters
        unique_chars = len(set(question.lower()))
        total_chars = len(question.replace(' ', ''))
        
        if total_chars > 0 and unique_chars / total_chars < 0.3:
            return {
                'valid': False,
                'reason': 'Question appears to be nonsensical',
                'user_message': 'Please ask a clear question about this bill using proper words.',
                'suggestions': [
                    'What is the main purpose of this bill?',
                    'How does this bill affect citizens?',
                    'What are the key provisions in this bill?'
                ]
            }
        
        # Check for repeated patterns (like "wwwwwww")
        if re.search(r'(.)\1{4,}', question):
            return {
                'valid': False,
                'reason': 'Question contains repeated characters',
                'user_message': 'Please ask a proper question about the bill.',
                'suggestions': [
                    'What does this bill do?',
                    'How will this bill affect me?',
                    'What are the main changes in this bill?'
                ]
            }
        
        # Check if question has actual words
        words = re.findall(r'\b[a-zA-Z]{2,}\b', question)
        if len(words) < 2:
            return {
                'valid': False,
                'reason': 'Question needs to contain actual words',
                'user_message': 'Please ask a complete question about this bill.',
                'suggestions': [
                    'What is this bill about?',
                    'How does this bill affect citizens?',
                    'What changes does this bill make?'
                ]
            }
        
        # Check if question is relevant to bill content
        relevant_keywords = [
            'bill', 'law', 'section', 'act', 'clause', 'provision',
            'tax', 'fee', 'penalty', 'right', 'citizen', 'mwananchi',
            'affect', 'impact', 'mean', 'what', 'how', 'when', 'where', 'why',
            'money', 'cost', 'pay', 'government', 'ministry', 'parliament'
        ]
        
        has_relevant_keyword = any(keyword in question_lower for keyword in relevant_keywords)
        
        # Check if it looks like a bill-related question
        question_patterns = [
            r'\bwhat\s+(does|is|are|will)\b',
            r'\bhow\s+(does|will|can)\b',
            r'\bwhen\s+(does|will)\b',
            r'\bwhere\s+(does|is)\b',
            r'\bwhy\s+(does|is)\b',
            r'\bwho\s+(is|will|can)\b',
            r'\b(explain|tell me|describe)\b',
            r'\b(impact|affect|effect)\b',
            r'\b(mean|means)\b',
        ]
        
        has_question_pattern = any(re.search(pattern, question_lower) for pattern in question_patterns)
        
        if not (has_relevant_keyword or has_question_pattern):
            return {
                'valid': False,
                'reason': 'Question does not appear to be about the bill',
                'user_message': 'Please ask a specific question about this bill.',
                'suggestions': [
                    'What does this bill mean for citizens?',
                    'How will this bill affect me?',
                    'What are the main changes in this bill?'
                ]
            }
        
        # Validate bill exists and is accessible
        try:
            bill = Bill.objects.get(
                id=bill_id,
                is_deleted=False,
                processing_status='completed'
            )
            
            if not bill.is_chunked or bill.total_chunks == 0:
                return {
                    'valid': False,
                    'reason': 'Chat is not available for this bill',
                    'suggestions': [
                        'This bill has not been processed for chat functionality',
                        'Try reading the summary instead'
                    ]
                }
        except Bill.DoesNotExist:
            return {
                'valid': False,
                'reason': 'Bill not found',
                'suggestions': ['Please check the bill ID and try again']
            }
        
        return {
            'valid': True,
            'reason': 'Question is valid',
            'suggestions': []
        }
        
    except Exception as e:
        logger.error(f"Error validating question: {str(e)}")
        return {
            'valid': False,
            'reason': 'Unable to validate question',
            'suggestions': ['Please try rephrasing your question']
        }


def find_relevant_chunks(bill_id: str, user_question: str, limit: int = 5) -> List[Dict]:
    """
    Find most relevant bill chunks for user question using keyword matching
    (This is a simplified version - embeddings would be more sophisticated)
    
    Args:
        bill_id: Bill UUID string
        user_question: User's question about the bill
        limit: Maximum chunks to return
    Returns:
        list[dict]: [
            {
                'chunk_id': str,
                'section_title': str,
                'content': str,
                'processed_content': str,
                'relevance_score': float,
                'chunk_order': int
            }
        ]
    """
    try:
        # Cache key for chunk search
        cache_key = f'chunk_search_{bill_id}_{hash(user_question.lower())}_{limit}'
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Get all chunks for the bill
        chunks = BillChunk.objects.filter(
            bill_id=bill_id,
            is_deleted=False
        ).order_by('chunk_index')
        
        if not chunks.exists():
            logger.warning(f"No chunks found for bill {bill_id}")
            return []
        
        # Extract keywords from user question
        question_lower = user_question.lower()
        
        # Remove common stop words and extract meaningful terms
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
            'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
        }
        
        # Extract keywords (simple approach)
        keywords = []
        words = re.findall(r'\b\w+\b', question_lower)
        for word in words:
            if len(word) > 2 and word not in stop_words:
                keywords.append(word)
        
        # Important domain-specific terms that boost relevance
        priority_terms = {
            'tax': 3.0, 'fee': 3.0, 'penalty': 3.0, 'fine': 3.0, 'money': 2.5,
            'citizen': 2.5, 'mwananchi': 2.5, 'people': 2.0, 'public': 2.0,
            'right': 3.0, 'rights': 3.0, 'obligation': 2.5, 'duty': 2.5,
            'government': 2.0, 'ministry': 2.0, 'authority': 2.0,
            'business': 2.5, 'company': 2.5, 'individual': 2.0,
            'affect': 2.0, 'impact': 2.0, 'change': 2.0, 'new': 1.5,
            'section': 1.5, 'clause': 1.5, 'provision': 1.5,
            'shall': 1.5, 'must': 2.0, 'required': 2.0, 'mandatory': 2.0
        }
        
        # Score each chunk based on keyword relevance
        chunk_scores = []
        
        for chunk in chunks:
            score = 0.0
            
            # Text to search in (prefer processed content if available)
            search_text = (chunk.processed_content or chunk.content).lower()
            section_title = chunk.section_title.lower()
            
            # Score based on keyword matches
            for keyword in keywords:
                # Title matches get higher score
                title_matches = section_title.count(keyword)
                content_matches = search_text.count(keyword)
                
                # Apply priority multiplier if it's a priority term
                multiplier = priority_terms.get(keyword, 1.0)
                
                score += (title_matches * 2.0 + content_matches * 1.0) * multiplier
            
            # Bonus for exact phrase matches
            if user_question.lower() in search_text:
                score += 5.0
            
            # Bonus for question-specific terms in content
            question_indicators = ['what', 'how', 'when', 'where', 'why', 'who']
            for indicator in question_indicators:
                if indicator in question_lower and indicator in search_text:
                    score += 1.0
            
            if score > 0:
                chunk_scores.append({
                    'chunk_id': str(chunk.id),
                    'section_title': chunk.section_title,
                    'content': chunk.content,
                    'processed_content': chunk.processed_content or chunk.content,
                    'relevance_score': round(score, 2),
                    'chunk_order': chunk.chunk_index,
                    'character_count': len(chunk.content)
                })
        
        # Sort by relevance score (highest first)
        chunk_scores.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Take top results
        relevant_chunks = chunk_scores[:limit]
        
        # If no relevant chunks found with keyword matching, return first few chunks
        if not relevant_chunks:
            logger.info(f"No keyword matches for question in bill {bill_id}, returning first chunks")
            for chunk in chunks[:limit]:
                relevant_chunks.append({
                    'chunk_id': str(chunk.id),
                    'section_title': chunk.section_title,
                    'content': chunk.content,
                    'processed_content': chunk.processed_content or chunk.content,
                    'relevance_score': 0.1,  # Low relevance score
                    'chunk_order': chunk.chunk_index,
                    'character_count': len(chunk.content)
                })
        
        # Cache results for 10 minutes
        cache.set(cache_key, relevant_chunks, timeout=600)
        
        logger.info(f"Found {len(relevant_chunks)} relevant chunks for question in bill {bill_id}")
        return relevant_chunks
        
    except Exception as e:
        logger.error(f"Error finding relevant chunks for bill {bill_id}: {str(e)}")
        return []


def generate_citizen_chat_response(bill_id: str, user_question: str, relevant_chunks: List[Dict], conversation_context: List[Dict] = None) -> Dict:
    """
    Generate AI response for citizen using relevant bill chunks
    
    Args:
        bill_id: Bill UUID string
        user_question: Citizen's question
        relevant_chunks: List of relevant chunks from find_relevant_chunks()
        conversation_context: Previous conversation history
    Returns:
        dict: {
            'success': bool,
            'response': str,
            'sources': list[str],  # Section titles used
            'confidence': float,
            'disclaimer': str,
            'follow_up_suggestions': list[str],
            'error': str (if failed)
        }
    """
    try:
        if not relevant_chunks:
            return {
                'success': False,
                'response': '',
                'sources': [],
                'confidence': 0.0,
                'disclaimer': '',
                'follow_up_suggestions': [],
                'error': 'No relevant information found in the bill for your question'
            }
        
        # Get bill information for context
        try:
            bill = Bill.objects.get(id=bill_id, is_deleted=False)
        except Bill.DoesNotExist:
            return {
                'success': False,
                'response': '',
                'sources': [],
                'confidence': 0.0,
                'disclaimer': '',
                'follow_up_suggestions': [],
                'error': 'Bill not found'
            }
        
        # Create the citizen chat prompt
        prompt = create_citizen_chat_prompt(
            user_question=user_question,
            relevant_chunks=relevant_chunks,
            bill_title=bill.title,
            conversation_context=conversation_context
        )
        
        # Prepare context data for LLM client
        context_data = {
            'bill_title': bill.title,
            'bill_id': str(bill_id),
            'user_question': user_question,
            'relevant_sections': [chunk['section_title'] for chunk in relevant_chunks],
            'conversation_length': len(conversation_context) if conversation_context else 0,
            'bill_status': bill.status,
            'chunks_count': len(relevant_chunks)
        }
        
        # Use the LLM client for AI response
        try:
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                llm_response = loop.run_until_complete(
                    llm_client.analyze_with_context(
                        prompt=prompt,
                        context_data=context_data,
                        response_format="text",
                        use_cache=True,
                        preferred_model="openai"
                    )
                )
            finally:
                loop.close()
            
            if llm_response.success:
                ai_response = llm_response.content
                
                # Extract sources from relevant chunks
                sources = list(set([chunk['section_title'] for chunk in relevant_chunks 
                                  if chunk['section_title'].strip()]))
                
                # Calculate confidence based on relevance scores and LLM confidence
                avg_relevance = sum(chunk.get('similarity_score', chunk.get('relevance_score', 0)) 
                                  for chunk in relevant_chunks) / len(relevant_chunks)
                
                # Enhanced confidence calculation
                base_confidence = min(0.95, max(0.7, avg_relevance / 2.0))
                
                # Boost for multiple chunks
                if len(relevant_chunks) >= 5:
                    base_confidence = min(0.95, base_confidence + 0.2)
                elif len(relevant_chunks) >= 3:
                    base_confidence = min(0.85, base_confidence + 0.15)
                elif len(relevant_chunks) >= 2:
                    base_confidence = min(0.8, base_confidence + 0.1)
                
                # Boost for comprehensive responses
                if len(ai_response) > 300:
                    base_confidence = min(0.9, base_confidence + 0.05)
                
                # Adjust confidence based on LLM response quality
                if llm_response.confidence_score:
                    confidence = (base_confidence + llm_response.confidence_score) / 2
                else:
                    confidence = base_confidence
                
                # Generate appropriate disclaimer
                disclaimer = get_appropriate_disclaimer(ai_response, user_question)
                
                # Generate follow-up suggestions
                follow_ups = generate_follow_up_questions(
                    bill_id, 
                    user_question + " " + ai_response
                )
                
                logger.info(f"Generated AI response for bill {bill_id} using {llm_response.model_used}")
                
                return {
                    'success': True,
                    'response': ai_response,
                    'sources': sources[:5],  # Limit to 5 sources
                    'confidence': round(confidence, 2),
                    'disclaimer': disclaimer,
                    'follow_up_suggestions': follow_ups,
                    'processing_info': {
                        'chunks_used': len(relevant_chunks),
                        'avg_relevance': round(avg_relevance, 2),
                        'bill_title': bill.title,
                        'model_used': llm_response.model_used,
                        'tokens_used': llm_response.tokens_used,
                        'processing_time': llm_response.processing_time
                    }
                }
            else:
                logger.warning(f"LLM client failed: {llm_response.error_message}")
                return create_fallback_response(user_question, relevant_chunks, bill.title)
                
        except Exception as e:
            logger.error(f"LLM client error: {str(e)}")
            return create_fallback_response(user_question, relevant_chunks, bill.title)
            
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        return {
            'success': False,
            'response': '',
            'sources': [],
            'confidence': 0.0,
            'disclaimer': '',
            'follow_up_suggestions': [],
            'error': f'Failed to generate response: {str(e)}'
        }


def create_fallback_response(user_question: str, relevant_chunks: List[Dict], bill_title: str) -> Dict:
    """
    Create fallback response when AI is not available
    """
    try:
        # Create a simple response based on the most relevant chunk
        if relevant_chunks:
            top_chunk = relevant_chunks[0]
            
            # Create basic response
            response = f"Based on the '{top_chunk['section_title']}' section of {bill_title}:\n\n"
            
            # Use processed content if available, otherwise use original
            content = top_chunk['processed_content'] or top_chunk['content']
            
            # Truncate content to reasonable length
            if len(content) > 400:
                content = content[:400] + "..."
            
            response += content
            response += "\n\nThis is a direct excerpt from the bill. For a more detailed explanation, AI processing is currently unavailable."
            
            sources = [chunk['section_title'] for chunk in relevant_chunks[:3] 
                      if chunk['section_title'].strip()]
            
            return {
                'success': True,
                'response': response,
                'sources': sources,
                'confidence': 0.5,  # Medium confidence for fallback
                'disclaimer': "This is a direct excerpt from the bill text. For legal advice, consult a qualified professional.",
                'follow_up_suggestions': [
                    "Try asking about a specific section",
                    "Ask about how this affects citizens",
                    "Inquire about implementation timeline"
                ],
                'fallback_used': True
            }
        else:
            return {
                'success': False,
                'response': "I couldn't find relevant information in the bill to answer your question. Please try rephrasing or asking about a different aspect of the bill.",
                'sources': [],
                'confidence': 0.0,
                'disclaimer': "",
                'follow_up_suggestions': [
                    "Try using simpler terms",
                    "Ask about main provisions of the bill",
                    "Inquire about citizen impacts"
                ],
                'error': 'No relevant content found'
            }
            
    except Exception as e:
        logger.error(f"Error creating fallback response: {str(e)}")
        return {
            'success': False,
            'response': "I'm unable to process your question at the moment. Please try again later.",
            'sources': [],
            'confidence': 0.0,
            'disclaimer': "",
            'follow_up_suggestions': [],
            'error': 'Fallback response creation failed'
        }


def generate_follow_up_questions(bill_id: str, current_context: str) -> List[str]:
    """
    Generate AI-powered follow-up questions based on conversation context
    
    Args:
        bill_id: Bill UUID string
        current_context: Current conversation context
    Returns:
        list[str]: List of suggested questions
    """
    try:
        # Cache key for follow-up questions
        cache_key = f'followup_questions_{bill_id}_{hash(current_context[:100])}'
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Get bill information
        try:
            bill = Bill.objects.get(id=bill_id, is_deleted=False)
        except Bill.DoesNotExist:
            return _get_fallback_followup_questions()
        
        # Get some chunk titles for context-specific suggestions
        chunk_sections = BillChunk.objects.filter(
            bill=bill,
            is_deleted=False
        ).values_list('section_title', flat=True).distinct()[:10]
        
        # Try to use AI for intelligent follow-up generation
        try:
            follow_up_prompt = create_follow_up_prompt(
                conversation_history=[{'question': '', 'answer': current_context}],
                bill_context={
                    'title': bill.title,
                    'complexity_level': 'advanced' if bill.total_chunks > 20 else 'basic',
                    'key_sections': list(chunk_sections)[:5]
                }
            )
            
            context_data = {
                'bill_title': bill.title,
                'bill_id': str(bill_id),
                'conversation_context': current_context[:500],  # Limit context size
                'key_sections': list(chunk_sections)[:5]
            }
            
            # Use LLM client for follow-up generation
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                llm_response = loop.run_until_complete(
                    llm_client.analyze_with_context(
                        prompt=follow_up_prompt,
                        context_data=context_data,
                        response_format="text",
                        use_cache=True,
                        preferred_model="openai"
                    )
                )
            finally:
                loop.close()
            
            if llm_response.success:
                # Parse AI-generated questions
                ai_questions = []
                lines = llm_response.content.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line and ('?' in line or line.endswith('?')):
                        # Clean up the question
                        question = line.strip('- •123456789. ').strip()
                        if len(question) > 10 and len(question) < 200:
                            ai_questions.append(question)
                
                if len(ai_questions) >= 3:
                    selected_questions = ai_questions[:4]
                    cache.set(cache_key, selected_questions, timeout=1800)
                    return selected_questions
                    
        except Exception as e:
            logger.warning(f"AI follow-up generation failed: {str(e)}")
        
        # Fallback to rule-based generation
        fallback_questions = _generate_rule_based_followups(current_context, chunk_sections)
        
        # Cache for 30 minutes
        cache.set(cache_key, fallback_questions, timeout=1800)
        return fallback_questions
        
    except Exception as e:
        logger.error(f"Error generating follow-up questions: {str(e)}")
        return _get_fallback_followup_questions()


def _generate_rule_based_followups(current_context: str, chunk_sections) -> List[str]:
    """Generate follow-up questions using rule-based approach"""
    # Base follow-up questions that work for most bills
    base_questions = [
        "How will this bill affect ordinary citizens?",
        "What are the main changes this bill introduces?", 
        "When will this bill take effect?",
        "What penalties are mentioned in this bill?",
        "How does this bill impact businesses?",
        "What rights does this bill give to citizens?",
        "What obligations does this bill place on citizens?",
        "How will this bill be implemented?",
        "What government agencies are involved in this bill?",
        "What fees or costs are mentioned in this bill?"
    ]
    
    # Context-specific questions based on current conversation
    context_lower = current_context.lower()
    context_questions = []
    
    if 'tax' in context_lower:
        context_questions.extend([
            "What are the tax rates mentioned?",
            "Who is exempt from these taxes?",
            "When are tax payments due?"
        ])
    
    if 'penalty' in context_lower or 'fine' in context_lower:
        context_questions.extend([
            "What are the maximum penalties?",
            "How are penalties calculated?",
            "Can penalties be appealed?"
        ])
    
    if 'business' in context_lower or 'company' in context_lower:
        context_questions.extend([
            "What licenses are required?",
            "What are the compliance requirements?",
            "How does this affect small businesses?"
        ])
    
    if 'citizen' in context_lower or 'mwananchi' in context_lower:
        context_questions.extend([
            "What services will citizens receive?",
            "How can citizens participate?",
            "What support is available for citizens?"
        ])
    
    # Section-specific questions
    section_questions = []
    for section in chunk_sections[:3]:  # Top 3 sections
        if section and section.strip():
            section_questions.append(f"Tell me more about the '{section}' section")
    
    # Combine and select diverse questions
    all_questions = base_questions + context_questions + section_questions
    
    # Remove duplicates and select up to 4 diverse questions
    unique_questions = list(dict.fromkeys(all_questions))  # Preserves order
    return unique_questions[:4]


def _get_fallback_followup_questions() -> List[str]:
    """Get basic fallback questions when all else fails"""
    return [
        "How will this bill affect citizens?",
        "What are the main provisions?",
        "When does this take effect?",
        "What are the key requirements?"
    ]


def analyze_conversation_context(conversation_history: List[Dict]) -> Dict:
    """
    Analyze conversation history to provide better context for responses
    
    Args:
        conversation_history: List of previous Q&A pairs
    Returns:
        dict: Analysis of conversation topics and trends
    """
    try:
        if not conversation_history:
            return {'topics': [], 'complexity': 'basic', 'focus_areas': []}
        
        # Extract topics from conversation
        all_text = ""
        for exchange in conversation_history[-5:]:  # Last 5 exchanges
            all_text += exchange.get('question', '') + " " + exchange.get('answer', '') + " "
        
        # Simple topic extraction
        topic_keywords = {
            'taxation': ['tax', 'levy', 'rate', 'revenue', 'income'],
            'penalties': ['penalty', 'fine', 'punishment', 'violation'],
            'rights': ['right', 'freedom', 'entitlement', 'protection'],
            'business': ['business', 'company', 'enterprise', 'commercial'],
            'government': ['ministry', 'authority', 'government', 'official'],
            'citizens': ['citizen', 'mwananchi', 'public', 'people']
        }
        
        text_lower = all_text.lower()
        detected_topics = []
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_topics.append(topic)
        
        # Determine complexity based on conversation length and topic variety
        complexity = 'basic'
        if len(conversation_history) > 3:
            complexity = 'intermediate'
        if len(conversation_history) > 6 or len(detected_topics) > 3:
            complexity = 'advanced'
        
        return {
            'topics': detected_topics,
            'complexity': complexity,
            'focus_areas': detected_topics[:3],  # Top 3 focus areas
            'conversation_length': len(conversation_history)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing conversation context: {str(e)}")
        return {'topics': [], 'complexity': 'basic', 'focus_areas': []}
