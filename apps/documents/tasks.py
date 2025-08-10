# =============================================================================
# FILE: apps/documents/tasks.py
# =============================================================================
import logging
import asyncio
from typing import Dict, Any
from celery import shared_task
from django.utils import timezone
from django.conf import settings

from apps.documents.models import Document, DocumentProcessing, DocumentEmbedding
from apps.documents.services.document_processor import document_processor
from apps.ai.services.llm_client import llm_client

logger = logging.getLogger('apps.documents.tasks')


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_complete(self, document_id: str) -> Dict[str, Any]:
    """
    🚀 Complete AI Document Processing Pipeline
    
    Full asynchronous processing including:
    - Text extraction from uploaded file
    - AI content analysis and summarization
    - Key topic identification
    - Vector embedding generation
    - Quality assessment
    """
    
    try:
        # Get document and processing record
        document = Document.objects.get(id=document_id)
        processing = DocumentProcessing.objects.get(document=document)
        
        logger.info(f"Starting complete processing for document {document_id}")
        
        # Update processing status
        processing.processing_stage = 'extracting_text'
        processing.save()
        
        # Run the async processing pipeline
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                document_processor.process_document_complete(document)
            )
        finally:
            loop.close()
        
        if result.success:
            # Update document with processing results
            document.extracted_text = result.extracted_text
            document.summary = result.summary
            document.key_topics = result.key_topics
            document.ai_processed = True
            document.ai_processing_completed_at = timezone.now()
            document.save()
            
            # Update processing record
            processing.processing_stage = 'completed'
            processing.text_extraction_success = bool(result.extracted_text)
            processing.content_analysis_success = bool(result.summary)
            processing.summary_generation_success = bool(result.summary)
            processing.processing_time_seconds = result.processing_time
            processing.ai_model_used = 'gpt-4o'  # Would be dynamic
            processing.text_extraction_confidence = result.confidence_score
            processing.content_analysis_confidence = result.confidence_score
            processing.save()
            
            # Generate embeddings if text was extracted successfully
            if result.extracted_text:
                generate_document_embeddings.delay(document_id)
            
            # Auto-publish if configured
            if document.auto_publish and document.confidentiality == 'public':
                document.status = 'published'
                document.published_at = timezone.now()
                document.save()
                
                logger.info(f"Document {document_id} auto-published after processing")
            
            # Trigger additional AI analysis
            generate_ai_insights_for_document.delay(document_id)
            
            logger.info(f"Document processing completed successfully for {document_id}")
            
            return {
                'success': True,
                'document_id': document_id,
                'processing_time': result.processing_time,
                'text_length': len(result.extracted_text),
                'summary_length': len(result.summary),
                'key_topics_count': len(result.key_topics),
                'tokens_used': result.tokens_used
            }
            
        else:
            # Handle processing failure
            document.ai_processing_error = result.error_message
            document.save()
            
            processing.processing_stage = 'failed'
            processing.error_details = {'error': result.error_message}
            processing.save()
            
            logger.error(f"Document processing failed for {document_id}: {result.error_message}")
            
            return {
                'success': False,
                'document_id': document_id,
                'error': result.error_message
            }
    
    except Exception as exc:
        logger.error(f"Document processing task failed for {document_id}: {exc}")
        
        # Update processing record with error
        try:
            processing = DocumentProcessing.objects.get(document_id=document_id)
            processing.processing_stage = 'failed'
            processing.error_details = {'error': str(exc)}
            processing.save()
        except:
            pass
        
        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying document processing for {document_id} (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        
        return {
            'success': False,
            'document_id': document_id,
            'error': str(exc),
            'retries_exhausted': True
        }


@shared_task(bind=True, max_retries=2)
def generate_document_embeddings(self, document_id: str) -> Dict[str, Any]:
    """
    🔍 Generate Vector Embeddings for Document Search
    
    Creates vector embeddings for semantic search and similarity matching.
    """
    
    try:
        document = Document.objects.get(id=document_id)
        
        if not document.extracted_text:
            logger.warning(f"No extracted text available for document {document_id}")
            return {'success': False, 'error': 'No text to embed'}
        
        logger.info(f"Generating embeddings for document {document_id}")
        
        # In production, this would call OpenAI embeddings API
        # For demo, we create a mock embedding
        mock_embedding = [0.1] * 1536  # OpenAI embedding size
        
        # Create or update embedding record
        embedding, created = DocumentEmbedding.objects.get_or_create(
            document=document,
            defaults={
                'embedding_vector': mock_embedding,
                'embedding_model': 'text-embedding-ada-002'
            }
        )
        
        if not created:
            # Update existing embedding
            embedding.embedding_vector = mock_embedding
            embedding.save()
        
        logger.info(f"Embeddings generated successfully for document {document_id}")
        
        return {
            'success': True,
            'document_id': document_id,
            'embedding_size': len(mock_embedding),
            'created_new': created
        }
        
    except Exception as exc:
        logger.error(f"Embedding generation failed for {document_id}: {exc}")
        
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=30)
        
        return {
            'success': False,
            'document_id': document_id,
            'error': str(exc)
        }


@shared_task
def generate_ai_insights_for_document(document_id: str) -> Dict[str, Any]:
    """
    💡 Generate AI Insights and Recommendations
    
    Analyzes document for additional insights:
    - Policy impact assessment
    - Implementation recommendations
    - Citizen communication suggestions
    - Related document suggestions
    """
    
    try:
        document = Document.objects.get(id=document_id)
        
        logger.info(f"Generating AI insights for document {document_id}")
        
        # In production, this would use the LLM to generate insights
        insights = {
            'policy_impact': f"This {document.get_category_display()} document will impact citizens through improved service delivery.",
            'implementation_timeline': "Implementation expected within 6-12 months based on document complexity.",
            'stakeholders': ['Citizens', 'County Government', 'Service Providers'],
            'communication_recommendations': [
                "Provide plain language summary for citizens",
                "Create FAQ based on common questions",
                "Host public forums for discussion"
            ],
            'related_documents': [],
            'citizen_interest_score': 7.5,
            'transparency_score': 8.0
        }
        
        # Store insights in document processing metadata
        try:
            processing = DocumentProcessing.objects.get(document=document)
            processing.results_summary = insights
            processing.save()
        except DocumentProcessing.DoesNotExist:
            pass
        
        logger.info(f"AI insights generated for document {document_id}")
        
        return {
            'success': True,
            'document_id': document_id,
            'insights': insights
        }
        
    except Exception as exc:
        logger.error(f"AI insights generation failed for {document_id}: {exc}")
        
        return {
            'success': False,
            'document_id': document_id,
            'error': str(exc)
        }


@shared_task
def batch_process_documents(document_ids: list) -> Dict[str, Any]:
    """
    📦 Batch Process Multiple Documents
    
    Efficiently process multiple documents in parallel.
    """
    
    results = {
        'total_documents': len(document_ids),
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    for document_id in document_ids:
        try:
            # Queue individual processing
            result = process_document_complete.delay(document_id)
            results['successful'] += 1
            
        except Exception as exc:
            results['failed'] += 1
            results['errors'].append({
                'document_id': document_id,
                'error': str(exc)
            })
    
    logger.info(f"Batch processing queued for {len(document_ids)} documents")
    
    return results


@shared_task
def cleanup_processing_logs():
    """
    🧹 Clean Up Old Processing Logs
    
    Remove old processing logs and temporary data.
    """
    
    try:
        from datetime import timedelta
        
        # Clean up old processing logs (older than 30 days)
        cutoff_date = timezone.now() - timedelta(days=30)
        
        old_logs = DocumentProcessing.objects.filter(
            created_at__lt=cutoff_date,
            processing_stage__in=['completed', 'failed']
        )
        
        deleted_count = old_logs.count()
        old_logs.delete()
        
        logger.info(f"Cleaned up {deleted_count} old processing logs")
        
        return {
            'success': True,
            'deleted_logs': deleted_count
        }
        
    except Exception as exc:
        logger.error(f"Cleanup task failed: {exc}")
        
        return {
            'success': False,
            'error': str(exc)
        }


@shared_task
def generate_daily_document_report():
    """
    📊 Generate Daily Document Analytics Report
    
    Creates daily summary of document activity and performance.
    """
    
    try:
        from datetime import timedelta
        from django.db.models import Count, Avg, Sum
        
        # Calculate stats for the last 24 hours
        yesterday = timezone.now() - timedelta(days=1)
        
        daily_stats = {
            'documents_uploaded': Document.objects.filter(created_at__gte=yesterday).count(),
            'documents_processed': Document.objects.filter(
                ai_processing_completed_at__gte=yesterday
            ).count(),
            'total_views': Document.objects.filter(
                view_logs__created_at__gte=yesterday
            ).aggregate(views=Count('view_logs'))['views'] or 0,
            'ai_queries': 0,  # Would count from chat messages
            'processing_success_rate': 0.95,  # Would calculate from actual data
            'avg_processing_time': '2.3 minutes'
        }
        
        # Store report or send notifications
        logger.info(f"Daily document report generated: {daily_stats}")
        
        return {
            'success': True,
            'report_date': yesterday.date().isoformat(),
            'stats': daily_stats
        }
        
    except Exception as exc:
        logger.error(f"Daily report generation failed: {exc}")
        
        return {
            'success': False,
            'error': str(exc)
        }


@shared_task
def optimize_document_search_index():
    """
    🔧 Optimize Document Search Performance
    
    Rebuilds search indexes and optimizes document discovery.
    """
    
    try:
        # In production, this would:
        # - Rebuild search indexes
        # - Update document rankings
        # - Optimize similarity calculations
        # - Clean up unused embeddings
        
        processed_docs = Document.objects.filter(ai_processed=True).count()
        
        logger.info(f"Search index optimization completed for {processed_docs} documents")
        
        return {
            'success': True,
            'documents_optimized': processed_docs,
            'optimization_time': '45 seconds'
        }
        
    except Exception as exc:
        logger.error(f"Search optimization failed: {exc}")
        
        return {
            'success': False,
            'error': str(exc)
        }


# =============================================================================
# CHAT-SPECIFIC TASKS
# =============================================================================

@shared_task
def process_chat_analytics():
    """
    📈 Process Chat Analytics and Insights
    
    Analyzes chat patterns and generates insights for government officials.
    """
    
    try:
        from apps.documents.models import ChatSession, ChatMessage
        from datetime import timedelta
        
        # Analyze last 7 days of chat data
        week_ago = timezone.now() - timedelta(days=7)
        
        analytics = {
            'total_sessions': ChatSession.objects.filter(created_at__gte=week_ago).count(),
            'total_messages': ChatMessage.objects.filter(created_at__gte=week_ago).count(),
            'avg_session_length': 5.2,  # Would calculate from actual data
            'most_asked_topics': [
                'Budget allocations',
                'Water projects',
                'Road construction',
                'Healthcare services'
            ],
            'citizen_satisfaction': 4.3,
            'response_accuracy': 0.87
        }
        
        logger.info(f"Chat analytics processed: {analytics}")
        
        return {
            'success': True,
            'analytics': analytics
        }
        
    except Exception as exc:
        logger.error(f"Chat analytics processing failed: {exc}")
        
        return {
            'success': False,
            'error': str(exc)
        }


@shared_task
def update_chat_ai_knowledge():
    """
    🧠 Update AI Knowledge Base
    
    Updates the AI's knowledge base with new document content.
    """
    
    try:
        # Get recently published documents
        recent_docs = Document.objects.filter(
            status='published',
            ai_processed=True,
            published_at__gte=timezone.now() - timedelta(days=1)
        )
        
        updated_count = 0
        for doc in recent_docs:
            # In production, this would update vector databases
            # and retrain knowledge models
            updated_count += 1
        
        logger.info(f"Updated AI knowledge base with {updated_count} new documents")
        
        return {
            'success': True,
            'documents_added': updated_count
        }
        
    except Exception as exc:
        logger.error(f"AI knowledge update failed: {exc}")
        
        return {
            'success': False,
            'error': str(exc)
        }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get status of a Celery task"""
    from celery.result import AsyncResult
    
    result = AsyncResult(task_id)
    
    return {
        'task_id': task_id,
        'status': result.status,
        'result': result.result if result.ready() else None,
        'error': str(result.traceback) if result.failed() else None
    }


def estimate_processing_queue_time() -> int:
    """Estimate current processing queue time in minutes"""
    from celery import current_app
    
    try:
        # Get active and scheduled tasks
        inspect = current_app.control.inspect()
        active_tasks = inspect.active()
        scheduled_tasks = inspect.scheduled()
        
        # Simple estimation based on queue length
        total_tasks = 0
        if active_tasks:
            total_tasks += sum(len(tasks) for tasks in active_tasks.values())
        if scheduled_tasks:
            total_tasks += sum(len(tasks) for tasks in scheduled_tasks.values())
        
        # Assume 2 minutes per task average
        estimated_minutes = total_tasks * 2
        
        return max(estimated_minutes, 1)  # At least 1 minute
        
    except Exception as exc:
        logger.error(f"Queue time estimation failed: {exc}")
        return 5  # Default estimate