# apps/api/citizen_views.py
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.core.paginator import Paginator
from django.db.models import Q
from django.core.cache import cache
from django.utils import timezone
from apps.projects.models import Bill, BillChunk
import logging
import re

logger = logging.getLogger(__name__)


class CitizenAPIThrottle(AnonRateThrottle):
    """Custom throttle for citizen API endpoints"""
    scope = 'citizen_api'
    rate = '100/hour'  # Allow 100 requests per hour for anonymous users


class CitizenChatThrottle(AnonRateThrottle):
    """Stricter throttle for chat endpoints to prevent abuse"""
    scope = 'citizen_chat'
    rate = '20/hour'  # 20 chat requests per hour for anonymous users


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([CitizenAPIThrottle])
def public_bills_list(request):
    """
    Get list of published bills for citizens
    
    Query Parameters:
        - page: Page number for pagination (default: 1)
        - page_size: Results per page (default: 20, max: 50)
        - status: Filter by bill status (optional)
        - search: Search in title/description (optional)
        - sponsor: Filter by sponsor (optional)
        - sort: Sort by 'created_at', 'title', 'deadline' (default: '-created_at')
    
    Returns: {
        'success': True,
        'bills': [...],
        'pagination': {...},
        'filters': {...}
    }
    """
    try:
        # Cache key for bill list to improve performance
        cache_key_base = 'citizen_bills_list_v2'
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = min(int(request.GET.get('page_size', 20)), 50)  # Max 50 per page
        status_filter = request.GET.get('status', '').strip()
        search_query = request.GET.get('search', '').strip()
        sponsor_filter = request.GET.get('sponsor', '').strip()
        sort_by = request.GET.get('sort', '-created_at')
        
        # Create cache key based on filters
        cache_key = f"{cache_key_base}_{page}_{page_size}_{status_filter}_{search_query}_{sponsor_filter}_{sort_by}"
        
        # Try to get from cache first
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.debug(f"Returning cached bill list for citizen")
            return Response(cached_result)
        
        # Base queryset - all bills including drafts
        bills_queryset = Bill.objects.filter(
            is_deleted=False,
            status__in=[  # Include draft bills for public viewing
                'draft', 'first_reading', 'committee_stage', 'second_reading', 
                'third_reading', 'presidential_assent', 'enacted'
            ]
        ).select_related('created_by')
        
        # Apply filters
        if status_filter:
            bills_queryset = bills_queryset.filter(status=status_filter)
        
        if search_query:
            bills_queryset = bills_queryset.filter(
                Q(title__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
        
        if sponsor_filter:
            bills_queryset = bills_queryset.filter(sponsor__icontains=sponsor_filter)
        
        # Apply sorting
        valid_sort_fields = ['created_at', '-created_at', 'title', '-title', 
                           'participation_deadline', '-participation_deadline']
        if sort_by in valid_sort_fields:
            bills_queryset = bills_queryset.order_by(sort_by)
        else:
            bills_queryset = bills_queryset.order_by('-created_at')
        
        # Paginate results
        paginator = Paginator(bills_queryset, page_size)
        bills_page = paginator.get_page(page)
        
        # Format bill data for citizens
        bills_data = []
        for bill in bills_page:
            # Check if bill can support chat (has chunks)
            can_chat = bill.is_chunked and bill.total_chunks > 0
            
            # Calculate estimated reading time (rough estimate: 250 words per minute)
            estimated_reading_time = 0
            if bill.summary:
                word_count = len(bill.summary.split())
                estimated_reading_time = max(1, word_count // 250)  # At least 1 minute
            
            bill_data = {
                'id': str(bill.id),
                'title': bill.title,
                'description': bill.description,
                'sponsor': bill.sponsor,
                'status': bill.status,
                'status_display': bill.get_status_display(),
                'participation_deadline': bill.participation_deadline,
                'created_at': bill.created_at,
                'summary_available': bool(bill.summary_html.strip()),
                'can_chat': can_chat,
                'total_chunks': bill.total_chunks,
                'estimated_reading_time': estimated_reading_time,
                'has_document': bool(bill.document),
                # Don't expose sensitive processing information to citizens
            }
            bills_data.append(bill_data)
        
        # Available filter options for frontend
        available_statuses = Bill.objects.filter(
            is_deleted=False
        ).values_list('status', flat=True).distinct()
        
        available_sponsors = Bill.objects.filter(
            is_deleted=False
        ).values_list('sponsor', flat=True).distinct()[:50]  # Limit for performance
        
        # Pagination info
        pagination_info = {
            'current_page': bills_page.number,
            'total_pages': paginator.num_pages,
            'total_bills': paginator.count,
            'has_next': bills_page.has_next(),
            'has_previous': bills_page.has_previous(),
            'page_size': page_size,
            'next_page': bills_page.next_page_number() if bills_page.has_next() else None,
            'previous_page': bills_page.previous_page_number() if bills_page.has_previous() else None,
        }
        
        result = {
            'success': True,
            'bills': bills_data,
            'pagination': pagination_info,
            'filters': {
                'available_statuses': [
                    {'value': status, 'display': dict(Bill._meta.get_field('status').choices)[status]}
                    for status in available_statuses
                ],
                'available_sponsors': list(available_sponsors),
                'current_filters': {
                    'status': status_filter,
                    'search': search_query,
                    'sponsor': sponsor_filter,
                    'sort': sort_by
                }
            },
            'summary': {
                'total_published_bills': paginator.count,
                'chat_enabled_bills': len([b for b in bills_data if b['can_chat']]),
                'recent_bills': len([b for b in bills_data if 
                    (timezone.now() - b['created_at']).days <= 30])
            },
            'timestamp': timezone.now().isoformat(),
            'cache_version': 'v2.1'
        }
        
        # Cache result for 5 minutes (shorter for better real-time updates)
        cache.set(cache_key, result, timeout=300)
        
        logger.info(f"Returned {len(bills_data)} bills to citizen (page {page})")
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error in public_bills_list: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to retrieve bills list',
            'message': 'Please try again later'
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([CitizenAPIThrottle])
def public_bill_detail(request, bill_id):
    """
    Get specific bill details with HTML formatted summary
    
    Args:
        bill_id: Bill UUID
        
    Returns: {
        'success': True,
        'bill': {...}
    }
    """
    try:
        # Cache key for individual bill
        cache_key = f'citizen_bill_detail_v2_{bill_id}'
        
        # Try cache first
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.debug(f"Returning cached bill detail for {bill_id}")
            return Response(cached_result)
        
        # Get bill (only if publicly accessible)
        try:
            bill = Bill.objects.select_related('created_by').get(
                id=bill_id,
                is_deleted=False,
                status__in=[  # Include draft bills for public viewing
                    'draft', 'first_reading', 'committee_stage', 'second_reading',
                    'third_reading', 'presidential_assent', 'enacted'
                ]
            )
        except Bill.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Bill not found or not publicly available',
                'message': 'This bill may be in draft status or still being processed'
            }, status=404)
        
        # Check if bill can support chat
        can_chat = bill.is_chunked and bill.total_chunks > 0
        
        # Get bill sections overview for chat context
        key_sections = []
        if can_chat:
            # Get unique section titles from chunks
            sections = BillChunk.objects.filter(
                bill=bill,
                is_deleted=False
            ).values_list('section_title', flat=True).distinct()[:10]  # Top 10 sections
            key_sections = [section for section in sections if section.strip()]
        
        # Estimate complexity based on content length and structure
        complexity_level = 'basic'
        if bill.total_chunks > 20:
            complexity_level = 'advanced'
        elif bill.total_chunks > 10:
            complexity_level = 'intermediate'
        
        # Calculate reading time
        estimated_reading_time = 5  # Default minimum
        if bill.summary_html:
            # Rough estimate: remove HTML tags and count words
            clean_text = re.sub('<[^<]+?>', '', bill.summary_html)
            word_count = len(clean_text.split())
            estimated_reading_time = max(5, word_count // 250)
        
        bill_data = {
            'id': str(bill.id),
            'title': bill.title,
            'description': bill.description,
            'sponsor': bill.sponsor,
            'status': bill.status,
            'status_display': bill.get_status_display(),
            'summary_html': bill.summary_html or '',  # HTML formatted for display
            'summary_markdown': bill.summary or '',  # Raw markdown if needed
            'participation_deadline': bill.participation_deadline,
            'created_at': bill.created_at,
            'document_url': bill.document.url if bill.document else None,
            'has_document': bool(bill.document),
            'can_chat': can_chat,
            'total_chunks': bill.total_chunks,
            'key_sections': key_sections,
            'complexity_level': complexity_level,
            'estimated_reading_time': estimated_reading_time,
            'word_count': len(re.sub('<[^<]+?>', '', bill.summary_html or '').split()),
            'created_by': bill.created_by.name if bill.created_by else 'Government',
            'last_updated': bill.updated_at,
            # Citizen engagement features
            'chat_available': can_chat,
            'search_available': can_chat,  # Can search if chunks available
            'mobile_optimized': True  # Always true for Phase 3
        }
        
        result = {
            'success': True,
            'bill': bill_data,
            'capabilities': {
                'can_chat': can_chat,
                'can_search': can_chat,
                'has_full_text': bool(bill.summary_html),
                'has_document': bool(bill.document)
            },
            'citizen_features': {
                'simplified_language': True,
                'section_navigation': len(key_sections) > 0,
                'interactive_qa': can_chat,
                'mobile_friendly': True
            }
        }
        
        # Cache for 30 minutes (bills don't change frequently)
        cache.set(cache_key, result, timeout=1800)
        
        logger.info(f"Returned bill detail for {bill_id} to citizen")
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error in public_bill_detail for {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to retrieve bill details',
            'message': 'Please try again later'
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([CitizenAPIThrottle])
def public_bill_search(request, bill_id):
    """
    Search within specific bill content using chunks
    
    Args:
        bill_id: Bill UUID
        Query parameters:
            - query: Search term (required)
            - limit: Maximum results (default: 10, max: 20)
            - section: Filter by section title (optional)
    
    Returns: {
        'success': True,
        'results': [...],
        'total_results': int,
        'query': str
    }
    """
    try:
        query = request.GET.get('query', '').strip()
        limit = min(int(request.GET.get('limit', 10)), 20)  # Max 20 results
        section_filter = request.GET.get('section', '').strip()
        
        if not query:
            return Response({
                'success': False,
                'error': 'Search query is required',
                'message': 'Please provide a search term'
            }, status=400)
        
        if len(query) < 3:
            return Response({
                'success': False,
                'error': 'Search query too short',
                'message': 'Please provide at least 3 characters'
            }, status=400)
        
        # Check if bill exists and is publicly accessible
        try:
            bill = Bill.objects.get(
                id=bill_id,
                is_deleted=False,
                status__in=[
                    'draft', 'first_reading', 'committee_stage', 'second_reading',
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
                'error': 'Search not available for this bill',
                'message': 'This bill has not been processed for search functionality'
            }, status=400)
        
        # Cache key for search results
        cache_key = f'citizen_search_{bill_id}_{query}_{limit}_{section_filter}'
        cached_result = cache.get(cache_key)
        if cached_result:
            return Response(cached_result)
        
        # Build search query for chunks
        chunks_queryset = BillChunk.objects.filter(
            bill=bill,
            is_deleted=False
        )
        
        # Apply section filter if provided
        if section_filter:
            chunks_queryset = chunks_queryset.filter(section_title__icontains=section_filter)
        
        # Simple text search (keyword matching)
        # In a production system, you might want to use full-text search or Elasticsearch
        matching_chunks = chunks_queryset.filter(
            Q(content__icontains=query) |
            Q(processed_content__icontains=query) |
            Q(section_title__icontains=query)
        ).order_by('chunk_index')[:limit]
        
        search_results = []
        for chunk in matching_chunks:
            # Create excerpt highlighting the search term
            content_text = chunk.processed_content or chunk.content
            
            # Simple excerpt generation (find query in text and show surrounding context)
            query_lower = query.lower()
            content_lower = content_text.lower()
            
            excerpt = content_text
            if query_lower in content_lower:
                # Find position and create excerpt with context
                pos = content_lower.find(query_lower)
                start = max(0, pos - 100)
                end = min(len(content_text), pos + len(query) + 100)
                excerpt = content_text[start:end].strip()
                
                # Add ellipsis if truncated
                if start > 0:
                    excerpt = "..." + excerpt
                if end < len(content_text):
                    excerpt = excerpt + "..."
            
            # Simple relevance score (more sophisticated scoring could be implemented)
            relevance_score = 1.0
            if query_lower in chunk.section_title.lower():
                relevance_score = 1.0  # Title match
            elif query_lower in content_lower:
                # Count occurrences for relevance
                occurrences = content_lower.count(query_lower)
                relevance_score = min(1.0, occurrences * 0.1)
            
            search_results.append({
                'chunk_id': str(chunk.id),
                'section_title': chunk.section_title,
                'content_excerpt': excerpt[:300],  # Limit excerpt length
                'relevance_score': relevance_score,
                'chunk_order': chunk.chunk_index,
                'match_type': 'content' if query_lower in content_lower else 'title'
            })
        
        # Sort by relevance score (highest first)
        search_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Get available sections for filtering
        available_sections = BillChunk.objects.filter(
            bill=bill,
            is_deleted=False
        ).values_list('section_title', flat=True).distinct()[:20]
        
        result = {
            'success': True,
            'results': search_results,
            'total_results': len(search_results),
            'query': query,
            'search_metadata': {
                'bill_id': str(bill_id),
                'bill_title': bill.title,
                'total_chunks_searched': chunks_queryset.count(),
                'search_time': timezone.now().isoformat(),
                'available_sections': list(available_sections)
            },
            'suggestions': {
                'try_different_terms': len(search_results) == 0,
                'search_tips': [
                    "Try using different keywords",
                    "Search for specific topics like 'tax', 'penalty', 'rights'",
                    "Use broader terms if no results found"
                ]
            }
        }
        
        # Cache results for 15 minutes
        cache.set(cache_key, result, timeout=900)
        
        logger.info(f"Search for '{query}' in bill {bill_id} returned {len(search_results)} results")
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error in public_bill_search for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'Search failed',
            'message': 'Please try again with different search terms'
        }, status=500)
