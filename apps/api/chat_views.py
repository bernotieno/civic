# apps/api/chat_views.py
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Q
from apps.projects.models import Bill, BillChunk
from .chat_service import (
    validate_chat_question,
    find_relevant_chunks,
    generate_citizen_chat_response,
    generate_follow_up_questions,
    analyze_conversation_context
)
from .embedding_service import hybrid_search

# OpenAPI documentation imports
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter, inline_serializer
from drf_spectacular.openapi import OpenApiTypes
from rest_framework import serializers
from .serializers import (
    ChatRequestSerializer, ChatResponseSerializer, ChatSuggestionRequestSerializer,
    ChatSuggestionsResponseSerializer, ChatContextResponseSerializer,
    ChatHistoryResponseSerializer, ErrorResponseSerializer
)

import logging
import uuid
import json

logger = logging.getLogger(__name__)


class CitizenChatThrottle(AnonRateThrottle):
    """Stricter throttle for chat endpoints to prevent abuse"""
    scope = 'citizen_chat'
    rate = '20/hour'  # 20 chat requests per hour for anonymous users


class CitizenChatAuthenticatedThrottle(AnonRateThrottle):
    """More lenient throttle for authenticated users"""  
    scope = 'citizen_chat_auth'
    rate = '50/hour'  # 50 chat requests per hour for authenticated users


@extend_schema(
    summary="Chat with AI about Parliamentary Bill",
    description="""
    Ask questions about a specific parliamentary bill and receive AI-powered responses.
    This endpoint provides intelligent answers based on the bill's content using advanced
    semantic search and natural language processing.
    
    **Key Features:**
    - AI-powered responses based on actual bill content
    - Context-aware conversation handling
    - Semantic search using embeddings for relevant content
    - Follow-up question suggestions
    - Anonymous and authenticated user support
    - Rate limiting for fair usage
    
    **Frontend Integration:**
    - Implement chat interface with message bubbles
    - Show typing indicators during processing
    - Display sources and confidence indicators
    - Enable follow-up question quick-select buttons
    - Handle session management for anonymous users
    - Implement conversation history display
    - Add disclaimer about information accuracy
    
    **Rate Limits:**
    - Anonymous users: 20 requests/hour
    - Authenticated users: 50 requests/hour
    - Session limit: 5 questions per session per hour
    
    **Response Features:**
    - Confidence scoring for answer reliability
    - Source attribution to specific bill sections
    - Contextual follow-up question suggestions
    - Conversation continuity support
    """,
    tags=["Citizen Chat"],
    parameters=[
        OpenApiParameter(
            name='bill_id',
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description='UUID of the bill to chat about',
            required=True
        )
    ],
    request=ChatRequestSerializer,
    examples=[
        OpenApiExample(
            "Basic Question",
            description="Simple question about bill impact",
            value={
                "question": "How will this bill affect small businesses?",
                "use_embeddings": True
            },
            request_only=True
        ),
        OpenApiExample(
            "Contextual Question",
            description="Question with conversation history",
            value={
                "question": "What are the specific penalties mentioned?",
                "conversation_context": [
                    {
                        "question": "What are the main provisions?",
                        "answer": "The bill establishes new regulations for...",
                        "timestamp": "2024-01-15T10:30:00Z"
                    }
                ],
                "session_id": "session-uuid-here",
                "use_embeddings": True
            },
            request_only=True
        )
    ],
    responses={
        200: OpenApiExample(
            "Successful Chat Response",
            description="AI successfully answered the question",
            value={
                "success": True,
                "response": "This bill will affect small businesses in several ways: 1) New compliance requirements for businesses with annual revenue over 5 million shillings, 2) Simplified tax filing procedures for SMEs, 3) Extended deadline for quarterly returns from 30 to 45 days.",
                "sources": [
                    "Section 12: Small Business Provisions",
                    "Section 18: Compliance Requirements", 
                    "Section 25: Tax Filing Procedures"
                ],
                "confidence": 0.92,
                "follow_up_questions": [
                    "What are the specific compliance requirements?",
                    "How do I qualify as a small business under this bill?",
                    "When do these changes take effect?"
                ],
                "conversation_id": "session-uuid-here",
                "disclaimer": "This information is based on the bill text and should not be considered legal advice. Consult a qualified professional for specific guidance.",
                "processing_info": {
                    "chunks_analyzed": 5,
                    "search_method": "hybrid",
                    "avg_relevance": 0.87,
                    "response_time": "2024-01-15T10:30:15Z",
                    "session_questions_count": 2
                },
                "bill_info": {
                    "id": "bill-uuid-here",
                    "title": "Finance Bill 2024",
                    "status": "committee_stage",
                    "status_display": "Committee Stage"
                }
            }
        ),
        400: OpenApiExample(
            "Invalid Question",
            value={
                "success": False,
                "error": "Question too short",
                "message": "Please provide a question of at least 5 characters",
                "suggestions": [
                    "Ask about main provisions of the bill",
                    "Inquire about how the bill affects citizens", 
                    "Try using different keywords"
                ]
            }
        ),
        404: OpenApiExample(
            "Bill Not Found",
            value={
                "success": False,
                "error": "Bill not found or not publicly available",
                "message": "This bill may be in draft status or still being processed"
            }
        ),
        429: OpenApiExample(
            "Rate Limited",
            value={
                "success": False,
                "error": "Too many questions from this session",
                "message": "Please wait before asking more questions",
                "retry_after": 1800
            }
        ),
        500: ErrorResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([CitizenChatThrottle])
def bill_chat(request, bill_id):
    """
    Chat with AI about specific bill
    
    Args:
        bill_id: Bill UUID
        Request body: {
            'question': str,
            'conversation_context': list[dict] (optional),
            'session_id': str (optional, for anonymous users),
            'use_embeddings': bool (optional, default: true)
        }
    
    Returns: {
        'success': True,
        'response': str,
        'sources': list[str],
        'confidence': float,
        'follow_up_questions': list[str],
        'conversation_id': str,
        'disclaimer': str,
        'processing_info': dict
    }
    """
    # notes_for_frontend: Implement chat UI with real-time typing, source display, and follow-up suggestions
    # Convert bill_id to string early to avoid UUID concatenation in cache keys
    bill_id = str(bill_id)
    try:
        # Get request data
        question = request.data.get('question', '').strip()
        conversation_context = request.data.get('conversation_context', [])
        session_id = request.data.get('session_id', str(uuid.uuid4()))
        use_embeddings = request.data.get('use_embeddings', True)
        
        if not question:
            return Response({
                'success': False,
                'error': 'Question is required',
                'message': 'Please provide a question about the bill'
            }, status=400)
        
        # Validate question
        validation = validate_chat_question(question, bill_id)
        if not validation['valid']:
            return Response({
                'success': False,
                'error': validation['reason'],
                'suggestions': validation['suggestions'],
                'message': 'Please rephrase your question'
            }, status=400)
        
        # Check if bill exists and is accessible
        try:
            bill = Bill.objects.get(
                id=bill_id,
                is_deleted=False,
                processing_status='completed',
                status__in=[
                    'first_reading', 'committee_stage', 'second_reading',
                    'third_reading', 'presidential_assent', 'enacted'
                ]
            )
        except Bill.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Bill not found or not publicly available',
                'message': 'This bill may be in draft status or still being processed'
            }, status=404)
        
        if not bill.is_chunked:
            return Response({
                'success': False,
                'error': 'Chat not available for this bill',
                'message': 'This bill has not been processed for chat functionality'
            }, status=400)
        
        # Rate limiting check for session (additional protection)
        session_key = f'chat_session_{session_id}_{str(bill_id)}'
        session_data = cache.get(session_key, {'count': 0, 'last_request': None})
        
        # Check if too many requests from this session
        now = timezone.now()
        if session_data['count'] >= 5:  # Max 5 questions per session per hour
            last_request = session_data.get('last_request')
            if last_request:
                time_diff = (now - last_request).total_seconds()
                if time_diff < 3600:  # Less than 1 hour
                    return Response({
                        'success': False,
                        'error': 'Too many questions from this session',
                        'message': 'Please wait before asking more questions',
                        'retry_after': int(3600 - time_diff)
                    }, status=429)
        
        # Find relevant chunks using hybrid search if embeddings enabled
        try:
            # Always use find_relevant_chunks which handles field mapping correctly
            relevant_chunks = find_relevant_chunks(bill_id, question, limit=5)

            # Debug: Check what fields the chunks actually have
            if relevant_chunks:
                logger.info(f"DEBUG: First chunk keys: {list(relevant_chunks[0].keys())}")
                logger.info(f"DEBUG: First chunk sample: {relevant_chunks[0]}")
            else:
                logger.warning("No relevant chunks found")
                
            search_method = 'hybrid' if use_embeddings else 'keyword_only'  
        except Exception as e:
            logger.error(f"Error finding relevant chunks: {str(e)}")
            # Fallback to basic search
            relevant_chunks = find_relevant_chunks(bill_id, question, limit=5)
            search_method = 'fallback'
        
        if not relevant_chunks:
            return Response({
                'success': False,
                'error': 'No relevant information found',
                'message': 'I could not find information in this bill related to your question. Try rephrasing or asking about different aspects of the bill.',
                'suggestions': [
                    'Ask about main provisions of the bill',
                    'Inquire about how the bill affects citizens',
                    'Try using different keywords'
                ],
                'conversation_id': session_id
            }, status=200)
        
        # Analyze conversation context if provided
        context_analysis = analyze_conversation_context(conversation_context)
        
        # Generate AI response
        chat_response = generate_citizen_chat_response(
            bill_id=bill_id,
            user_question=question,
            relevant_chunks=relevant_chunks,
            conversation_context=conversation_context
        )
        
        if not chat_response.get('success', False):
            return Response({
                'success': False, 
                'error': chat_response.get('error', 'Failed to generate response'),
                'message': 'I am unable to answer your question at the moment. Please try again later.',
                'conversation_id': session_id
            }, status=500)  
        
        # Update session data
        session_data['count'] = session_data.get('count', 0) + 1
        session_data['last_request'] = now
        session_data['last_question'] = question
        cache.set(session_key, session_data, timeout=3600)  # 1 hour
        
        # Store conversation for context (optional, privacy-aware)
        conversation_key = f'conversation_{session_id}_{str(bill_id)}'
        conversation_history = cache.get(conversation_key, [])
        conversation_history.append({
            'question': question,
            'answer': chat_response['response'],
            'timestamp': now.isoformat(),
            'sources': chat_response['sources']
        })
        # Keep only last 10 exchanges
        conversation_history = conversation_history[-10:]
        cache.set(conversation_key, conversation_history, timeout=3600)
        
        # Generate follow-up questions
        follow_up_context = question + " " + chat_response['response']
        follow_ups = generate_follow_up_questions(bill_id, follow_up_context)
        
        # Prepare response
        response_data = {
            'success': True,
            'response': chat_response['response'],
            'sources': chat_response['sources'],
            'confidence': chat_response['confidence'],
            'follow_up_questions': follow_ups,
            'conversation_id': session_id,
            'disclaimer': chat_response['disclaimer'],
            'processing_info': {
                'chunks_analyzed': len(relevant_chunks),
                'search_method': search_method,
                'avg_relevance': round(sum(c['relevance_score'] for c in relevant_chunks) / len(relevant_chunks), 2) if relevant_chunks else 0,
                'context_analysis': context_analysis,
                'response_time': timezone.now().isoformat(),
                'bill_title': bill.title,
                'session_questions_count': session_data['count']
            },
            'bill_info': {
                'id': str(bill.id),
                'title': bill.title,
                'status': bill.status,
                'status_display': bill.get_status_display()
            }
        }
        
        # Add fallback indicator if used
        if chat_response.get('fallback_used'):
            response_data['fallback_used'] = True
            response_data['message'] = 'AI processing unavailable, showing direct bill content'
        
        logger.info(f"Generated chat response for bill {bill_id}, session {session_id}")
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error in bill_chat for {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'Chat service temporarily unavailable',
            'message': 'Please try again later or contact support if the problem persists'
        }, status=500)


@extend_schema(
    summary="Get Chat Question Suggestions",
    description="""
    Generate contextual question suggestions for a bill based on its content and complexity.
    Helps users discover relevant topics and provides guidance on effective questions to ask.
    
    **Question Categories:**
    - **Basic**: Simple questions about bill overview and main provisions
    - **Intermediate**: Questions about implementation, business impact, and procedures
    - **Advanced**: Complex policy analysis, technical details, and sectoral impacts
    - **Contextual**: Section-specific questions based on bill content
    
    **Frontend Integration:**
    - Display suggestions as clickable question cards/buttons
    - Organize by complexity level with visual indicators
    - Enable filtering by category (basic/intermediate/advanced)
    - Show topic areas with appropriate icons
    - Implement lazy loading for better performance
    - Add refresh button to generate new suggestions
    
    **Suggestion Quality:**
    - Context-aware based on actual bill content
    - Covers multiple topic areas and complexity levels
    - Avoids repetition and provides variety
    - Includes section-specific questions for detailed exploration
    """,
    tags=["Citizen Chat"],
    parameters=[
        OpenApiParameter(
            name='bill_id',
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description='UUID of the bill to get suggestions for',
            required=True
        )
    ],
    request=ChatSuggestionRequestSerializer,
    examples=[
        OpenApiExample(
            "All Categories",
            description="Get suggestions from all categories",
            value={
                "category": "all",
                "limit": 6
            },
            request_only=True
        ),
        OpenApiExample(
            "Basic Questions Only", 
            description="Get only simple, basic questions",
            value={
                "category": "basic",
                "limit": 8
            },
            request_only=True
        )
    ],
    responses={
        200: OpenApiExample(
            "Question Suggestions Response",
            value={
                "success": True,
                "suggestions": [
                    {
                        "question": "What is this bill about?",
                        "category": "basic",
                        "complexity": "basic",
                        "topic_area": "overview"
                    },
                    {
                        "question": "How will this bill affect small businesses?",
                        "category": "intermediate", 
                        "complexity": "intermediate",
                        "topic_area": "business_impact"
                    },
                    {
                        "question": "What are the long-term economic implications?",
                        "category": "advanced",
                        "complexity": "advanced", 
                        "topic_area": "policy_analysis"
                    },
                    {
                        "question": "What does the 'Tax Administration' section mean?",
                        "category": "contextual",
                        "complexity": "basic",
                        "topic_area": "sections"
                    }
                ],
                "bill_info": {
                    "id": "bill-uuid-here",
                    "title": "Finance Bill 2024",
                    "complexity_level": "intermediate",
                    "total_sections": 15,
                    "chat_available": True
                },
                "suggestion_metadata": {
                    "total_available": 24,
                    "returned": 4,
                    "category_filter": "all",
                    "generated_at": "2024-01-15T10:30:00Z"
                }
            }
        ),
        404: ErrorResponseSerializer,
        500: ErrorResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([CitizenChatThrottle])
def bill_chat_suggestions(request, bill_id):
    """
    Get suggested questions for bill based on content and complexity
    
    Args:
        bill_id: Bill UUID
        Request body: {
            'category': str (optional: 'basic', 'intermediate', 'advanced'),
            'limit': int (optional, default: 6, max: 10)
        }
    
    Returns: {
        'success': True,
        'suggestions': [
            {
                'question': str,
                'category': str,
                'complexity': str,
                'topic_area': str
            }
        ]
    }
    """
    # notes_for_frontend: Display as clickable question cards, organize by complexity, add visual indicators for categories
    try:
        category = request.data.get('category', 'all')
        limit = min(int(request.data.get('limit', 6)), 10)
        
        # Check if bill exists and is accessible
        try:
            bill = Bill.objects.get(
                id=bill_id,
                is_deleted=False,
                processing_status='completed',
                status__in=[
                    'first_reading', 'committee_stage', 'second_reading',
                    'third_reading', 'presidential_assent', 'enacted'
                ]
            )
        except Bill.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Bill not found or not publicly available'
            }, status=404)
        
        if not bill.is_chunked:
            return Response({
                'success': False,
                'error': 'Suggestions not available for this bill',
                'message': 'This bill has not been processed for chat functionality'
            }, status=400)
        
        # Cache key for suggestions
        cache_key = f'chat_suggestions_{bill_id}_{category}_{limit}'
        cached_suggestions = cache.get(cache_key)
        if cached_suggestions:
            return Response(cached_suggestions)
        
        # Get bill sections for context-aware suggestions
        chunk_sections = BillChunk.objects.filter(
            bill=bill,
            is_deleted=False
        ).values_list('section_title', flat=True).distinct()[:15]
        
        # Base question templates by category and topic
        question_templates = {
            'basic': {
                'overview': [
                    "What is this bill about?",
                    "What are the main changes this bill introduces?",
                    "Who does this bill affect?",
                    "When will this bill take effect?",
                ],
                'citizen_impact': [
                    "How will this bill affect ordinary citizens?",
                    "What do citizens need to know about this bill?",
                    "What rights does this bill give to citizens?",
                    "What obligations does this bill place on citizens?"
                ],
                'practical': [
                    "What are the costs mentioned in this bill?",
                    "Are there any fees or taxes in this bill?",
                    "What penalties are mentioned in this bill?",
                    "How will this bill be enforced?"
                ]
            },
            'intermediate': {
                'implementation': [
                    "Which government agencies will implement this bill?",
                    "What is the timeline for implementing this bill?",
                    "What procedures are established by this bill?",
                    "How will compliance be monitored?"
                ],
                'business_impact': [
                    "How does this bill affect businesses?",
                    "What licenses or permits are required?",
                    "What are the compliance requirements for companies?",
                    "How does this bill affect small vs large businesses?"
                ],
                'legal_framework': [
                    "What existing laws does this bill change?",
                    "What new legal requirements are introduced?",
                    "How does this bill relate to other legislation?",
                    "What appeals process is established?"
                ]
            },
            'advanced': {
                'policy_analysis': [
                    "What are the long-term implications of this bill?",
                    "How does this bill address current policy gaps?",
                    "What stakeholder interests are balanced in this bill?",
                    "What economic impacts might this bill have?"
                ],
                'technical_details': [
                    "What are the technical specifications in this bill?",
                    "How are disputes resolved under this bill?",
                    "What international standards does this bill reference?",
                    "What transitional provisions are included?"
                ],
                'sectoral_impact': [
                    "How does this bill affect the financial sector?",
                    "What are the environmental implications?",
                    "How does this bill impact technology sector?",
                    "What are the healthcare implications?"
                ]
            }
        }
        
        # Generate section-specific questions
        section_questions = []
        for section in list(chunk_sections)[:5]:  # Top 5 sections
            if section and section.strip():
                section_questions.extend([
                    f"What does the '{section}' section mean?",
                    f"How does the '{section}' section affect me?",
                    f"Explain the '{section}' provisions"
                ])
        
        # Build suggestions list
        suggestions = []
        
        # Add base questions by category
        if category == 'all' or category == 'basic':
            for topic, questions in question_templates['basic'].items():
                for q in questions:
                    suggestions.append({
                        'question': q,
                        'category': 'basic',
                        'complexity': 'basic',
                        'topic_area': topic
                    })
        
        if category == 'all' or category == 'intermediate':
            for topic, questions in question_templates['intermediate'].items():
                for q in questions:
                    suggestions.append({
                        'question': q,
                        'category': 'intermediate',
                        'complexity': 'intermediate', 
                        'topic_area': topic
                    })
        
        if category == 'all' or category == 'advanced':
            for topic, questions in question_templates['advanced'].items():
                for q in questions:
                    suggestions.append({
                        'question': q,
                        'category': 'advanced',
                        'complexity': 'advanced',
                        'topic_area': topic
                    })
        
        # Add section-specific questions
        for q in section_questions[:6]:  # Limit section questions
            suggestions.append({
                'question': q,
                'category': 'contextual',
                'complexity': 'basic',
                'topic_area': 'sections'
            })
        
        # Shuffle and limit results
        import random
        random.shuffle(suggestions)
        
        # Filter by category if specified
        if category != 'all':
            suggestions = [s for s in suggestions if s['category'] == category]
        
        # Take requested number
        final_suggestions = suggestions[:limit]
        
        result = {
            'success': True,
            'suggestions': final_suggestions,
            'bill_info': {
                'id': str(bill.id),
                'title': bill.title,
                'complexity_level': 'advanced' if bill.total_chunks > 20 else 'intermediate' if bill.total_chunks > 10 else 'basic',
                'total_sections': len(chunk_sections),
                'chat_available': True
            },
            'suggestion_metadata': {
                'total_available': len(suggestions),
                'returned': len(final_suggestions),
                'category_filter': category,
                'generated_at': timezone.now().isoformat()
            }
        }
        
        # Cache for 2 hours
        cache.set(cache_key, result, timeout=7200)
        
        logger.info(f"Generated {len(final_suggestions)} chat suggestions for bill {bill_id}")
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error generating chat suggestions for {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to generate suggestions',
            'message': 'Unable to generate question suggestions at the moment'
        }, status=500)


@extend_schema(
    summary="Get Bill Chat Context",
    description="""
    Retrieve comprehensive context information for a bill's chat interface.
    Provides all necessary metadata to set up and optimize the chat experience.
    
    **Context Information Includes:**
    - Bill metadata (title, sponsor, status, deadlines)
    - Structural information (sections, complexity, word count)
    - Chat capabilities and limitations  
    - Usage guidelines and best practices
    - Reading time estimates and accessibility info
    
    **Frontend Integration:**
    - Use for chat interface initialization
    - Display bill overview card/panel
    - Show capability indicators and limitations
    - Implement complexity-based UI adjustments
    - Provide usage tips and help content
    - Enable document download if available
    
    **Chat Interface Setup:**
    - Configure session limits based on capabilities
    - Adjust UI complexity based on bill complexity level
    - Display appropriate help text and examples
    - Show estimated interaction time and reading recommendations
    """,
    tags=["Citizen Chat"],
    parameters=[
        OpenApiParameter(
            name='bill_id',
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description='UUID of the bill to get context for',
            required=True
        )
    ],
    responses={
        200: OpenApiExample(
            "Bill Chat Context",
            value={
                "success": True,
                "bill_context": {
                    "title": "Finance Bill 2024",
                    "sponsor": "Ministry of Finance and Planning",
                    "status": "committee_stage",
                    "status_display": "Committee Stage",
                    "description": "Comprehensive tax reform legislation affecting individuals and businesses",
                    "key_sections": [
                        "Tax Administration",
                        "Income Tax Provisions", 
                        "VAT Regulations",
                        "Penalty Framework",
                        "Implementation Timeline"
                    ],
                    "complexity_level": "intermediate",
                    "estimated_reading_time": 15,
                    "total_chunks": 25,
                    "participation_deadline": "2024-08-15T23:59:59Z",
                    "created_at": "2024-01-15T10:30:00Z",
                    "last_updated": "2024-02-01T14:20:00Z",
                    "chat_capabilities": {
                        "can_chat": True,
                        "supports_context": True,
                        "supports_followups": True,
                        "supports_search": True,
                        "embedding_enabled": True,
                        "max_questions_per_session": 5,
                        "response_languages": ["English"]
                    },
                    "word_count": 3500,
                    "has_document": True,
                    "document_url": "/media/bills/finance-bill-2024.pdf"
                },
                "usage_guidelines": {
                    "how_to_ask": [
                        "Ask specific questions about bill content",
                        "Use simple, clear language",
                        "Focus on how the bill affects you", 
                        "Ask one question at a time"
                    ],
                    "what_you_can_ask": [
                        "Questions about citizen impacts",
                        "Explanations of legal terms",
                        "Implementation timelines",
                        "Fees, taxes, and penalties",
                        "Rights and obligations"
                    ],
                    "limitations": [
                        "Responses are based only on bill text",
                        "This is not legal advice",
                        "Complex legal questions may need professional consultation",
                        "Limited to 5 questions per session"
                    ]
                },
                "context_metadata": {
                    "generated_at": "2024-01-15T10:30:00Z",
                    "bill_id": "bill-uuid-here",
                    "context_version": "1.0"
                }
            }
        ),
        404: ErrorResponseSerializer,
        500: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([CitizenChatThrottle])
def bill_chat_context(request, bill_id):
    """
    Get bill context information for chat interface
    
    Args:
        bill_id: Bill UUID
    
    Returns: {
        'success': True,
        'bill_context': {
            'title': str,
            'sponsor': str,
            'status': str,
            'key_sections': list[str],
            'complexity_level': str,
            'estimated_reading_time': int,
            'total_chunks': int,
            'chat_capabilities': dict
        }
    }
    """
    # notes_for_frontend: Use for chat interface setup, display bill overview, configure UI based on complexity level
    try:
        # Check if bill exists and is accessible
        try:
            bill = Bill.objects.get(
                id=bill_id,
                is_deleted=False,
                processing_status='completed',
                status__in=[
                    'first_reading', 'committee_stage', 'second_reading',
                    'third_reading', 'presidential_assent', 'enacted'
                ]
            )
        except Bill.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Bill not found or not publicly available'
            }, status=404)
        
        # Cache key for context
        cache_key = f'chat_context_{bill_id}'
        cached_context = cache.get(cache_key)
        if cached_context:
            return Response(cached_context)
        
        # Get key sections
        key_sections = []
        if bill.is_chunked:
            sections = BillChunk.objects.filter(
                bill=bill,
                is_deleted=False
            ).values_list('section_title', flat=True).distinct()[:10]
            key_sections = [section for section in sections if section.strip()]
        
        # Determine complexity level
        complexity_level = 'basic'
        complexity_factors = 0
        
        if bill.total_chunks > 20:
            complexity_factors += 2
        elif bill.total_chunks > 10:
            complexity_factors += 1
        
        if len(key_sections) > 8:
            complexity_factors += 1
        
        if len(bill.summary or '') > 2000:
            complexity_factors += 1
        
        if complexity_factors >= 3:
            complexity_level = 'advanced'
        elif complexity_factors >= 2:
            complexity_level = 'intermediate'
        
        # Estimate reading time
        import re
        clean_summary = re.sub('<[^<]+?>', '', bill.summary_html or bill.summary or '')
        word_count = len(clean_summary.split())
        estimated_reading_time = max(3, word_count // 250)  # 250 words per minute
        
        # Chat capabilities
        chat_capabilities = {
            'can_chat': bill.is_chunked and bill.total_chunks > 0,
            'supports_context': True,
            'supports_followups': True,
            'supports_search': bill.is_chunked,
            'embedding_enabled': bill.is_chunked and any(
                chunk.embedding for chunk in BillChunk.objects.filter(bill=bill)[:5]
            ),
            'max_questions_per_session': 5,
            'response_languages': ['English']  # Could be extended
        }
        
        # Build context
        bill_context = {
            'title': bill.title,
            'sponsor': bill.sponsor,
            'status': bill.status,
            'status_display': bill.get_status_display(),
            'description': bill.description,
            'key_sections': key_sections,
            'complexity_level': complexity_level,
            'estimated_reading_time': estimated_reading_time,
            'total_chunks': bill.total_chunks,
            'participation_deadline': bill.participation_deadline,
            'created_at': bill.created_at,
            'last_updated': bill.updated_at,
            'chat_capabilities': chat_capabilities,
            'word_count': word_count,
            'has_document': bool(bill.document),
            'document_url': bill.document.url if bill.document else None
        }
        
        # Usage guidelines for citizens
        usage_guidelines = {
            'how_to_ask': [
                "Ask specific questions about bill content",
                "Use simple, clear language",
                "Focus on how the bill affects you",
                "Ask one question at a time"
            ],
            'what_you_can_ask': [
                "Questions about citizen impacts",
                "Explanations of legal terms",
                "Implementation timelines",
                "Fees, taxes, and penalties",
                "Rights and obligations"
            ],
            'limitations': [
                "Responses are based only on bill text",
                "This is not legal advice",
                "Complex legal questions may need professional consultation",
                f"Limited to {chat_capabilities['max_questions_per_session']} questions per session"
            ]
        }
        
        result = {
            'success': True,
            'bill_context': bill_context,
            'usage_guidelines': usage_guidelines,
            'context_metadata': {
                'generated_at': timezone.now().isoformat(),
                'bill_id': str(bill.id),
                'context_version': '1.0'
            }
        }
        
        # Cache for 1 hour (context doesn't change frequently)
        cache.set(cache_key, result, timeout=3600)
        
        logger.info(f"Generated chat context for bill {bill_id}")
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error getting chat context for {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to get chat context',
            'message': 'Unable to load chat information at the moment'
        }, status=500)


@extend_schema(
    summary="Get Chat History",
    description="""
    Retrieve conversation history for a specific chat session (privacy-aware).
    Allows users to review previous questions and answers within their current session.
    
    **Privacy & Security:**
    - Session-based storage (not permanent)
    - Automatic expiry after 1 hour
    - Limited to 20 recent exchanges maximum
    - No personal data storage beyond session duration
    - Anonymous session support
    
    **Frontend Integration:**
    - Display as conversation thread with timestamps
    - Show question-answer pairs with source attribution
    - Implement infinite scroll for long conversations
    - Enable copy/share functionality for useful answers
    - Show session information and remaining questions
    - Provide conversation export/save options
    
    **Session Management:**
    - Track total questions asked in session
    - Display remaining question quota
    - Show session expiration information
    - Handle session cleanup and renewal
    """,
    tags=["Citizen Chat"],
    parameters=[
        OpenApiParameter(
            name='bill_id',
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description='UUID of the bill',
            required=True
        ),
        OpenApiParameter(
            name='session_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Session ID for the conversation (required)',
            required=True
        ),
        OpenApiParameter(
            name='limit',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Maximum number of recent exchanges to return (default: 10, max: 20)',
            required=False
        )
    ],
    responses={
        200: OpenApiExample(
            "Chat History Response",
            value={
                "success": True,
                "conversation_history": [
                    {
                        "question": "What is this bill about?",
                        "answer": "This bill is about tax reform and establishes new regulations for...",
                        "timestamp": "2024-01-15T10:25:00Z",
                        "sources": [
                            "Section 1: Introduction",
                            "Section 2: Scope and Application"
                        ]
                    },
                    {
                        "question": "How will this affect small businesses?",
                        "answer": "Small businesses will be affected in several ways: simplified filing procedures...",
                        "timestamp": "2024-01-15T10:28:00Z",
                        "sources": [
                            "Section 12: Small Business Provisions",
                            "Section 25: Implementation"
                        ]
                    }
                ],
                "session_info": {
                    "session_id": "session-uuid-here",
                    "total_questions": 2,
                    "last_activity": "2024-01-15T10:28:00Z",
                    "questions_remaining": 3
                },
                "bill_info": {
                    "id": "bill-uuid-here",
                    "session_expires_in": 3600
                }
            }
        ),
        400: OpenApiExample(
            "Missing Session ID",
            value={
                "success": False,
                "error": "Session ID is required"
            }
        ),
        500: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def bill_chat_history(request, bill_id):
    """
    Get chat history for a session (privacy-aware)
    
    Args:
        bill_id: Bill UUID
        Query params:
            - session_id: Session ID (required)
            - limit: Number of recent exchanges (default: 10, max: 20)
    
    Returns: {
        'success': True,
        'conversation_history': list[dict],
        'session_info': dict
    }
    """
    # notes_for_frontend: Display as conversation thread, show session info, implement scroll to load more history
    try:
        session_id = request.GET.get('session_id')
        limit = min(int(request.GET.get('limit', 10)), 20)
        
        if not session_id:
            return Response({
                'success': False,
                'error': 'Session ID is required'
            }, status=400)
        
        # Get conversation history from cache
        conversation_key = f'conversation_{session_id}_{bill_id}'
        conversation_history = cache.get(conversation_key, [])
        
        # Limit to requested number of recent exchanges
        recent_history = conversation_history[-limit:]
        
        # Get session info
        session_key = f'chat_session_{session_id}_{bill_id}'
        session_data = cache.get(session_key, {})
        
        result = {
            'success': True,
            'conversation_history': recent_history,
            'session_info': {
                'session_id': session_id,
                'total_questions': session_data.get('count', 0),
                'last_activity': session_data.get('last_request'),
                'questions_remaining': max(0, 5 - session_data.get('count', 0))
            },
            'bill_info': {
                'id': bill_id,
                'session_expires_in': 3600  # 1 hour
            }
        }
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to retrieve chat history'
        }, status=500)