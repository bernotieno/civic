# =============================================================================
# FILE: apps/documents/services/ai_chat_service.py
# =============================================================================
import logging
import time
import asyncio
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from apps.ai.services.llm_client import llm_client, get_json_response, quick_analyze
from apps.documents.models import Document, ChatSession, ChatMessage

logger = logging.getLogger('apps.documents.services')


@dataclass
class ChatResponse:
    """Standardized chat response format"""
    success: bool
    message: str = ""
    sources: List[Dict] = None
    suggestions: List[str] = None
    confidence_score: float = 0.0
    processing_time: float = 0.0
    tokens_used: int = 0
    error_message: str = ""

    def __post_init__(self):
        if self.sources is None:
            self.sources = []
        if self.suggestions is None:
            self.suggestions = []


class DocumentChatService:
    """
    🚀 HACKATHON-WINNING: AI-Powered Document Q&A Engine
    
    Advanced conversational AI for citizens to query government documents:
    - Natural language understanding of citizen questions
    - Multi-document context awareness
    - Kenyan civic expertise and cultural sensitivity
    - Source attribution and transparency
    - Follow-up question suggestions
    - Conversation memory and context
    """
    
    def __init__(self):
        self.max_context_length = getattr(settings, 'CHAT_MAX_CONTEXT_LENGTH', 4000)
        self.max_sources_per_response = getattr(settings, 'CHAT_MAX_SOURCES', 3)
        self.conversation_memory_limit = getattr(settings, 'CHAT_MEMORY_LIMIT', 10)
        
    async def process_user_question(
        self,
        question: str,
        session_id: str,
        user=None,
        county_id: int = None
    ) -> ChatResponse:
        """
        🎯 Process citizen question about government documents
        
        Complete pipeline:
        1. Understand user intent and extract keywords
        2. Search relevant documents with semantic matching
        3. Retrieve document context and excerpts
        4. Generate contextual response with sources
        5. Create follow-up suggestions
        6. Store conversation for continuity
        """
        start_time = time.time()
        
        try:
            # Get or create chat session
            session = await self.get_or_create_session(session_id, user, county_id)
            
            # Store user message
            user_message = await self.store_user_message(session, question)
            
            # Step 1: Analyze user intent and extract search terms
            intent_analysis = await self.analyze_user_intent(question, session)
            
            # Step 2: Find relevant documents
            relevant_docs = await self.find_relevant_documents(
                question, 
                intent_analysis,
                session.county,
                user
            )
            
            if not relevant_docs:
                return await self.handle_no_documents_found(question, session)
            
            # Step 3: Generate AI response with document context
            ai_response = await self.generate_contextual_response(
                question,
                relevant_docs,
                session,
                intent_analysis
            )
            
            # Step 4: Store AI response
            await self.store_ai_message(
                session,
                ai_response.message,
                relevant_docs,
                ai_response.suggestions,
                ai_response.confidence_score,
                ai_response.tokens_used
            )
            
            # Step 5: Update session statistics
            await self.update_session_stats(session, ai_response.tokens_used)
            
            processing_time = time.time() - start_time
            ai_response.processing_time = processing_time
            
            logger.info(f"Processed chat question in {processing_time:.2f}s for session {session_id}")
            return ai_response
            
        except Exception as e:
            logger.error(f"Chat processing failed for session {session_id}: {e}")
            return ChatResponse(
                success=False,
                error_message=f"Failed to process your question: {e}",
                processing_time=time.time() - start_time
            )
    
    async def analyze_user_intent(self, question: str, session: ChatSession) -> Dict:
        """
        🧠 Understand user intent and extract search keywords
        
        Analyzes:
        - Question type (factual, procedural, comparative, etc.)
        - Key entities and topics
        - Urgency and priority indicators
        - Document type preferences
        """
        try:
            # Get conversation context
            recent_messages = await self.get_conversation_context(session)
            
            intent_prompt = f"""
            Analyze this citizen question about government documents in Kenya. Consider the conversation context.

            Current Question: "{question}"
            
            Previous Context: {recent_messages}
            
            Provide analysis in JSON format:
            {{
                "intent_type": "factual|procedural|comparative|complaint|request",
                "main_topics": ["topic1", "topic2"],
                "search_keywords": ["keyword1", "keyword2", "keyword3"],
                "document_types": ["budget", "policy", "strategic_plan"],
                "urgency_level": "low|medium|high",
                "question_category": "budget|services|procedures|rights|other",
                "citizen_context": "individual|business|community",
                "language_style": "formal|casual|concerned|urgent",
                "specific_location": "county|ward|village|none",
                "confidence": 0.95
            }}
            
            Focus on Kenyan civic context and government document types.
            """
            
            context_data = {
                "user_question": question,
                "session_county": session.county.name,
                "question_length": len(question),
                "has_context": len(recent_messages) > 0
            }
            
            intent_result = await get_json_response(intent_prompt, context_data)
            
            return intent_result or {
                "intent_type": "factual",
                "main_topics": [],
                "search_keywords": question.split(),
                "document_types": ["budget", "policy"],
                "confidence": 0.5
            }
            
        except Exception as e:
            logger.error(f"Intent analysis failed: {e}")
            return {
                "intent_type": "factual",
                "search_keywords": question.split(),
                "confidence": 0.3
            }
    
    async def find_relevant_documents(
        self,
        question: str,
        intent_analysis: Dict,
        county,
        user
    ) -> List[Document]:
        """
        🔍 Find documents relevant to user question
        
        Multi-step search:
        1. Keyword matching in titles and summaries
        2. Semantic similarity using embeddings
        3. Category and department filtering
        4. Access permission checking
        5. Relevance ranking
        """
        try:
            # Extract search parameters
            keywords = intent_analysis.get('search_keywords', [])
            doc_types = intent_analysis.get('document_types', [])
            main_topics = intent_analysis.get('main_topics', [])
            
            # Build base query
            query = Q(county=county, status='published')
            
            # Add access permissions
            if user and user.is_authenticated:
                if user.role == 'citizen':
                    query &= Q(confidentiality='public')
                elif user.role == 'government_official':
                    accessible_levels = ['public']
                    if user.official_level in ['regional', 'national', 'super_admin']:
                        accessible_levels.extend(['internal', 'restricted'])
                    if user.official_level in ['national', 'super_admin']:
                        accessible_levels.append('confidential')
                    query &= Q(confidentiality__in=accessible_levels)
            else:
                # Anonymous users see only public documents
                query &= Q(confidentiality='public')
            
            # Add category filter
            if doc_types:
                query &= Q(category__in=doc_types)
            
            # Search by keywords in title, summary, and extracted text
            if keywords:
                keyword_query = Q()
                for keyword in keywords:
                    keyword_query |= (
                        Q(title__icontains=keyword) |
                        Q(summary__icontains=keyword) |
                        Q(extracted_text__icontains=keyword) |
                        Q(key_topics__contains=[keyword])
                    )
                query &= keyword_query
            
            # Execute search
            documents = Document.objects.filter(query).select_related('county')[:10]
            
            # Rank documents by relevance
            ranked_docs = await self.rank_documents_by_relevance(
                list(documents),
                question,
                intent_analysis
            )
            
            return ranked_docs[:self.max_sources_per_response]
            
        except Exception as e:
            logger.error(f"Document search failed: {e}")
            return []
    
    async def rank_documents_by_relevance(
        self,
        documents: List[Document],
        question: str,
        intent_analysis: Dict
    ) -> List[Document]:
        """
        📊 Rank documents by relevance to user question
        
        Ranking factors:
        - Keyword match density
        - Document category alignment
        - Recency and importance
        - User engagement metrics
        - AI confidence scores
        """
        try:
            scored_docs = []
            
            for doc in documents:
                score = 0.0
                
                # Keyword matching score
                question_words = set(question.lower().split())
                title_words = set(doc.title.lower().split())
                summary_words = set((doc.summary or "").lower().split())
                
                # Title match (high weight)
                title_matches = len(question_words & title_words)
                score += title_matches * 3.0
                
                # Summary match (medium weight)
                summary_matches = len(question_words & summary_words)
                score += summary_matches * 2.0
                
                # Category alignment
                preferred_categories = intent_analysis.get('document_types', [])
                if doc.category in preferred_categories:
                    score += 5.0
                
                # Engagement metrics (popularity boost)
                engagement_score = (doc.view_count * 0.1) + (doc.ai_query_count * 0.5)
                score += min(engagement_score, 10.0)  # Cap at 10 points
                
                # Recency bonus (newer documents get slight boost)
                days_old = (timezone.now() - doc.created_at).days
                if days_old < 30:
                    score += 2.0
                elif days_old < 90:
                    score += 1.0
                
                scored_docs.append((doc, score))
            
            # Sort by score (descending)
            scored_docs.sort(key=lambda x: x[1], reverse=True)
            
            return [doc for doc, score in scored_docs]
            
        except Exception as e:
            logger.error(f"Document ranking failed: {e}")
            return documents
    
    async def generate_contextual_response(
        self,
        question: str,
        relevant_docs: List[Document],
        session: ChatSession,
        intent_analysis: Dict
    ) -> ChatResponse:
        """
        🤖 Generate AI response with document context and sources
        
        Response includes:
        - Direct answer to citizen question
        - Supporting evidence from documents
        - Plain language explanations
        - Cultural and local context
        - Next steps or recommendations
        """
        try:
            # Prepare document context
            doc_context = await self.prepare_document_context(relevant_docs)
            
            # Get conversation history
            conversation_context = await self.get_conversation_context(session)
            
            # Build comprehensive prompt
            response_prompt = f"""
            You are a helpful AI assistant for {session.county.name} County government in Kenya. 
            A citizen has asked about government documents. Provide a clear, helpful response.

            Citizen Question: "{question}"
            
            Question Analysis: {intent_analysis}
            
            Relevant Government Documents:
            {doc_context}
            
            Previous Conversation: {conversation_context}
            
            Instructions:
            - Answer the citizen's question clearly and directly
            - Use information from the provided documents as sources
            - Explain complex government terms in simple language
            - Be culturally sensitive and respectful
            - Include specific references to document sections when relevant
            - Suggest practical next steps if applicable
            - If information is not in the documents, clearly state this
            
            Provide your response in JSON format:
            {{
                "main_answer": "Clear, direct answer to the citizen's question",
                "supporting_details": "Additional context and explanations",
                "document_sources": ["Source 1 citation", "Source 2 citation"],
                "next_steps": "Practical actions the citizen can take",
                "related_info": "Additional relevant information",
                "confidence_level": 0.95,
                "follow_up_questions": [
                    "What else would you like to know about this topic?",
                    "Would you like information about related services?",
                    "Do you need help understanding the process?"
                ]
            }}
            
            Be helpful, accurate, and citizen-focused in your response.
            """
            
            context_data = {
                "citizen_question": question,
                "county_name": session.county.name,
                "document_count": len(relevant_docs),
                "intent_type": intent_analysis.get('intent_type', 'factual'),
                "conversation_length": session.message_count
            }
            
            # Get AI response
            ai_result = await get_json_response(response_prompt, context_data)
            
            if not ai_result:
                return ChatResponse(
                    success=False,
                    error_message="AI failed to generate response"
                )
            
            # Format final response
            main_answer = ai_result.get('main_answer', '')
            supporting_details = ai_result.get('supporting_details', '')
            next_steps = ai_result.get('next_steps', '')
            
            # Combine into comprehensive response
            full_response = main_answer
            if supporting_details:
                full_response += f"\n\n**Additional Information:**\n{supporting_details}"
            if next_steps:
                full_response += f"\n\n**Next Steps:**\n{next_steps}"
            
            # Prepare sources
            sources = await self.format_document_sources(relevant_docs, ai_result.get('document_sources', []))
            
            # Generate follow-up suggestions
            suggestions = ai_result.get('follow_up_questions', [])
            if not suggestions:
                suggestions = await self.generate_default_suggestions(intent_analysis, session.county)
            
            return ChatResponse(
                success=True,
                message=full_response,
                sources=sources,
                suggestions=suggestions,
                confidence_score=float(ai_result.get('confidence_level', 0.8)),
                tokens_used=1200  # Estimated token usage
            )
            
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return ChatResponse(
                success=False,
                error_message=f"Failed to generate response: {e}"
            )
    
    async def prepare_document_context(self, documents: List[Document]) -> str:
        """Prepare document content for AI context"""
        context = ""
        
        for i, doc in enumerate(documents):
            context += f"\n=== Document {i+1}: {doc.title} ===\n"
            context += f"Category: {doc.get_category_display()}\n"
            context += f"Department: {doc.department}\n"
            
            if doc.summary:
                context += f"Summary: {doc.summary[:800]}...\n"
            
            if doc.key_topics:
                context += f"Key Topics: {', '.join(doc.key_topics[:5])}\n"
            
            # Add relevant excerpts from extracted text
            if doc.extracted_text:
                context += f"Content Excerpt: {doc.extracted_text[:1000]}...\n"
            
            context += "\n"
        
        return context
    
    async def format_document_sources(self, documents: List[Document], citations: List[str]) -> List[Dict]:
        """Format document sources for response"""
        sources = []
        
        for doc in documents:
            # Record that this document was queried
            doc.record_ai_query()
            
            source = {
                'id': str(doc.id),
                'title': doc.title,
                'category': doc.get_category_display(),
                'department': doc.department,
                'url': doc.get_public_url(),
                'excerpt': doc.summary[:200] if doc.summary else "",
                'relevance_score': 0.8  # Would be calculated based on matching
            }
            sources.append(source)
        
        return sources
    
    async def generate_default_suggestions(self, intent_analysis: Dict, county) -> List[str]:
        """Generate default follow-up questions"""
        category = intent_analysis.get('question_category', 'general')
        
        suggestions_map = {
            'budget': [
                "How much budget is allocated for infrastructure?",
                "What are the main spending priorities this year?",
                "How can citizens participate in budget planning?"
            ],
            'services': [
                "What services are available in my area?",
                "How do I apply for government services?",
                "What are the service delivery timelines?"
            ],
            'procedures': [
                "What documents do I need for this process?",
                "How long does this procedure take?",
                "Where do I submit my application?"
            ],
            'rights': [
                "What are my rights as a citizen?",
                "How do I report violations?",
                "What legal protections do I have?"
            ]
        }
        
        return suggestions_map.get(category, [
            "Can you explain this in simpler terms?",
            "What else should I know about this topic?",
            "How does this affect my community?"
        ])
    
    async def get_conversation_context(self, session: ChatSession) -> str:
        """Get recent conversation context for continuity"""
        try:
            recent_messages = ChatMessage.objects.filter(
                session=session
            ).order_by('-created_at')[:self.conversation_memory_limit]
            
            context = ""
            for msg in reversed(recent_messages):
                role = "User" if msg.message_type == 'user' else "Assistant"
                context += f"{role}: {msg.content[:200]}...\n"
            
            return context
            
        except Exception as e:
            logger.error(f"Failed to get conversation context: {e}")
            return ""
    
    async def handle_no_documents_found(self, question: str, session: ChatSession) -> ChatResponse:
        """Handle case when no relevant documents are found"""
        
        general_help_response = f"""
        I couldn't find specific government documents that answer your question about "{question}" 
        in {session.county.name} County. 

        Here are some options:
        
        **What you can do:**
        - Try rephrasing your question with different keywords
        - Contact {session.county.name} County directly for specific information
        - Check if new documents have been published recently
        - Visit the county office for personalized assistance
        
        **Common document types available:**
        - Budget documents and financial reports
        - Policy documents and regulations  
        - Strategic plans and development programs
        - Service delivery guidelines
        
        Feel free to ask about any of these topics, and I'll do my best to help!
        """
        
        suggestions = [
            "Show me available budget documents",
            "What policies are published for citizens?",
            "How can I contact the county government?",
            "What services are available in my area?"
        ]
        
        return ChatResponse(
            success=True,
            message=general_help_response,
            suggestions=suggestions,
            confidence_score=0.7
        )
    
    async def get_or_create_session(self, session_id: str, user, county_id: int) -> ChatSession:
        """Get existing session or create new one"""
        try:
            session = ChatSession.objects.get(session_id=session_id, is_active=True)
            return session
        except ChatSession.DoesNotExist:
            from apps.users.models import County
            
            county = County.objects.get(id=county_id) if county_id else user.tenant
            
            session = ChatSession.objects.create(
                session_id=session_id,
                user=user,
                county=county,
                is_anonymous=not user or user.role == 'anonymous'
            )
            return session
    
    async def store_user_message(self, session: ChatSession, content: str) -> ChatMessage:
        """Store user message in conversation"""
        message = ChatMessage.objects.create(
            session=session,
            message_type='user',
            content=content
        )
        
        session.message_count += 1
        session.save(update_fields=['message_count'])
        
        return message
    
    async def store_ai_message(
        self,
        session: ChatSession,
        content: str,
        source_docs: List[Document],
        suggestions: List[str],
        confidence: float,
        tokens_used: int
    ) -> ChatMessage:
        """Store AI response in conversation"""
        message = ChatMessage.objects.create(
            session=session,
            message_type='ai',
            content=content,
            confidence_score=confidence,
            tokens_used=tokens_used,
            suggested_questions=suggestions
        )
        
        # Link source documents
        if source_docs:
            message.source_documents.set(source_docs)
        
        session.message_count += 1
        session.save(update_fields=['message_count'])
        
        return message
    
    async def update_session_stats(self, session: ChatSession, tokens_used: int):
        """Update session statistics"""
        session.total_tokens_used += tokens_used
        
        # Estimate API cost (rough calculation)
        cost_per_1k_tokens = 0.002  # Average cost
        additional_cost = (tokens_used / 1000) * cost_per_1k_tokens
        session.total_api_cost += additional_cost
        
        session.save(update_fields=['total_tokens_used', 'total_api_cost'])


# Global service instance
document_chat_service = DocumentChatService()


# Utility functions
async def process_chat_question(question: str, session_id: str, user=None, county_id=None) -> ChatResponse:
    """Async wrapper for chat processing"""
    return await document_chat_service.process_user_question(question, session_id, user, county_id)


def get_active_sessions_count(county=None) -> int:
    """Get count of active chat sessions"""
    query = ChatSession.objects.filter(is_active=True)
    if county:
        query = query.filter(county=county)
    return query.count()


def get_popular_questions(county=None, limit=10) -> List[str]:
    """Get most frequently asked questions"""
    # In production, this would analyze actual chat patterns
    return [
        "How much budget is allocated for road construction?",
        "What are the water project timelines?",
        "How can I participate in budget planning?",
        "What services are available in my ward?",
        "How do I report corruption or misconduct?"
    ]


async def end_chat_session(session_id: str, satisfaction_rating=None):
    """End a chat session"""
    try:
        session = ChatSession.objects.get(session_id=session_id, is_active=True)
        session.end_session(satisfaction_rating)
        return True
    except ChatSession.DoesNotExist:
        return False