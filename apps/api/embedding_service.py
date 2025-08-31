# apps/api/embedding_service.py
import os
import json
import urllib.request
import urllib.parse
import numpy as np
from typing import List, Dict, Tuple, Optional
from django.db.models import Q
from django.core.cache import cache
from django.utils import timezone
from apps.projects.models import Bill, BillChunk
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging
import hashlib

logger = logging.getLogger(__name__)


def generate_query_embedding(query: str) -> Optional[List[float]]:
    """
    Generate embedding for user query using OpenAI API
    
    Args:
        query: User's search query or question
    Returns:
        list[float]: Embedding vector, None if failed
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OpenAI API key not available for embedding generation")
            return None
        
        # Cache embeddings for frequently used queries
        cache_key = f'query_embedding_{hashlib.md5(query.encode()).hexdigest()}'
        cached_embedding = cache.get(cache_key)
        if cached_embedding:
            return cached_embedding
        
        # Prepare API request for OpenAI embeddings
        data = {
            "input": query.strip(),
            "model": "text-embedding-3-small"  # Cost-effective embedding model
        }
        
        req = urllib.request.Request(
            "https://api.openai.com/v1/embeddings",
            data=json.dumps(data).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                result = json.loads(response.read().decode('utf-8'))
                embedding = result['data'][0]['embedding']
                
                # Cache for 1 hour
                cache.set(cache_key, embedding, timeout=3600)
                
                logger.debug(f"Generated embedding for query: {query[:50]}...")
                return embedding
            else:
                logger.error(f"OpenAI embedding API returned status {response.status}")
                return None
                
    except Exception as e:
        logger.error(f"Error generating query embedding: {str(e)}")
        return None


def generate_chunk_embeddings(bill_id: str, force_regenerate: bool = False) -> Dict:
    """
    Generate embeddings for all chunks of a bill for semantic search
    
    Args:
        bill_id: Bill UUID string
        force_regenerate: Force regeneration even if embeddings exist
    Returns:
        dict: {
            'success': bool,
            'embeddings_generated': int,
            'bill_id': str,
            'error': str,
            'skipped': int
        }
    """
    try:
        # Get bill and verify it exists
        try:
            bill = Bill.objects.get(id=bill_id, is_deleted=False)
        except Bill.DoesNotExist:
            return {
                'success': False,
                'embeddings_generated': 0,
                'bill_id': bill_id,
                'error': 'Bill not found',
                'skipped': 0
            }
        
        if not bill.is_chunked:
            return {
                'success': False,
                'embeddings_generated': 0,
                'bill_id': bill_id,
                'error': 'Bill has not been chunked yet',
                'skipped': 0
            }
        
        # Get all chunks for the bill
        chunks = BillChunk.objects.filter(
            bill=bill,
            is_deleted=False
        ).order_by('chunk_index')
        
        if not chunks.exists():
            return {
                'success': False,
                'embeddings_generated': 0,
                'bill_id': bill_id,
                'error': 'No chunks found for bill',
                'skipped': 0
            }
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Generate placeholder embeddings for development/testing
            return generate_placeholder_embeddings(bill_id, chunks)
        
        embeddings_generated = 0
        embeddings_skipped = 0
        
        # Process chunks in batches to manage API costs
        batch_size = 10  # Process 10 chunks at a time
        chunk_list = list(chunks)
        
        for i in range(0, len(chunk_list), batch_size):
            batch = chunk_list[i:i + batch_size]
            
            # Prepare batch data for embedding API
            texts_to_embed = []
            chunks_to_update = []
            
            for chunk in batch:
                # Skip if embedding already exists and not forcing regeneration
                if chunk.embedding and not force_regenerate:
                    embeddings_skipped += 1
                    continue
                
                # Use processed content if available, otherwise use original content
                text_content = chunk.processed_content or chunk.content
                
                # Truncate very long content to manage API costs and limits
                if len(text_content) > 2000:
                    text_content = text_content[:2000] + "..."
                
                texts_to_embed.append(text_content)
                chunks_to_update.append(chunk)
            
            # Generate embeddings for this batch
            if texts_to_embed:
                try:
                    batch_embeddings = generate_batch_embeddings(texts_to_embed)
                    
                    if batch_embeddings and len(batch_embeddings) == len(chunks_to_update):
                        # Update chunks with their embeddings
                        for chunk, embedding in zip(chunks_to_update, batch_embeddings):
                            chunk.embedding = {
                                'model': 'text-embedding-3-small',
                                'vector': embedding,
                                'generated_at': timezone.now().isoformat(),
                                'content_length': len(chunk.processed_content or chunk.content)
                            }
                            chunk.save(update_fields=['embedding'])
                            embeddings_generated += 1
                            
                        logger.info(f"Generated embeddings for batch of {len(chunks_to_update)} chunks")
                    else:
                        logger.error(f"Batch embedding generation failed or count mismatch")
                        
                except Exception as e:
                    logger.error(f"Error processing batch embeddings: {str(e)}")
                    continue
        
        logger.info(f"Generated {embeddings_generated} embeddings for bill {bill_id}")
        
        return {
            'success': True,
            'embeddings_generated': embeddings_generated,
            'bill_id': bill_id,
            'error': None,
            'skipped': embeddings_skipped,
            'total_chunks': len(chunk_list),
            'processing_info': {
                'model_used': 'text-embedding-3-small',
                'batch_size': batch_size,
                'force_regenerate': force_regenerate
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating embeddings for bill {bill_id}: {str(e)}")
        return {
            'success': False,
            'embeddings_generated': 0,
            'bill_id': bill_id,
            'error': f'Embedding generation failed: {str(e)}',
            'skipped': 0
        }


def generate_batch_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """
    Generate embeddings for a batch of texts
    
    Args:
        texts: List of text strings to embed
    Returns:
        list[list[float]]: List of embedding vectors, None if failed
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        
        data = {
            "input": texts,
            "model": "text-embedding-3-small"
        }
        
        req = urllib.request.Request(
            "https://api.openai.com/v1/embeddings",
            data=json.dumps(data).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:  # Longer timeout for batch
            if response.status == 200:
                result = json.loads(response.read().decode('utf-8'))
                embeddings = [item['embedding'] for item in result['data']]
                return embeddings
            else:
                logger.error(f"Batch embedding API returned status {response.status}")
                return None
                
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        return None


def generate_placeholder_embeddings(bill_id: str, chunks) -> Dict:
    """
    Generate placeholder embeddings when OpenAI API is not available
    This is for development/testing purposes
    
    Args:
        bill_id: Bill UUID string  
        chunks: QuerySet of BillChunk objects
    Returns:
        dict: Result summary
    """
    try:
        embeddings_generated = 0
        
        for chunk in chunks:
            if chunk.embedding:  # Skip if already has embedding
                continue
                
            # Create a simple hash-based placeholder embedding
            content = chunk.processed_content or chunk.content
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            # Convert hex to pseudo-embedding (384 dimensions for text-embedding-3-small)
            placeholder_embedding = []
            for i in range(0, min(len(content_hash), 32), 2):  # Use pairs of hex digits
                hex_pair = content_hash[i:i+2]
                # Convert to float in range [-1, 1]
                value = (int(hex_pair, 16) - 127.5) / 127.5
                placeholder_embedding.append(value)
            
            # Pad to 384 dimensions
            while len(placeholder_embedding) < 384:
                placeholder_embedding.append(0.0)
            
            # Store placeholder embedding
            chunk.embedding = {
                'model': 'placeholder',
                'vector': placeholder_embedding[:384],
                'generated_at': timezone.now().isoformat(),
                'is_placeholder': True,
                'content_length': len(content)
            }
            chunk.save(update_fields=['embedding'])
            embeddings_generated += 1
        
        logger.info(f"Generated {embeddings_generated} placeholder embeddings for bill {bill_id}")
        
        return {
            'success': True,
            'embeddings_generated': embeddings_generated,
            'bill_id': bill_id,
            'error': None,
            'skipped': 0,
            'placeholder_used': True
        }
        
    except Exception as e:
        logger.error(f"Error generating placeholder embeddings: {str(e)}")
        return {
            'success': False,
            'embeddings_generated': 0,
            'bill_id': bill_id,
            'error': str(e),
            'skipped': 0
        }


def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors
    
    Args:
        vec1: First vector
        vec2: Second vector
    Returns:
        float: Cosine similarity score (0-1)
    """
    try:
        # Convert to numpy arrays for efficient computation
        a = np.array(vec1)
        b = np.array(vec2)
        
        # Calculate cosine similarity
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        similarity = dot_product / (norm_a * norm_b)
        
        # Normalize to 0-1 range (cosine similarity is -1 to 1)
        return (similarity + 1) / 2
        
    except Exception as e:
        logger.error(f"Error calculating cosine similarity: {str(e)}")
        return 0.0


def find_similar_chunks_by_embedding(bill_id: str, query_embedding: List[float], limit: int = 5) -> List[Dict]:
    """
    Find chunks similar to query using embeddings
    
    Args:
        bill_id: Bill UUID string
        query_embedding: Query embedding vector
        limit: Maximum results to return
    Returns:
        list[dict]: Similar chunks with similarity scores
    """
    try:
        if not query_embedding:
            return []
        
        # Get chunks with embeddings for the bill
        chunks = BillChunk.objects.filter(
            bill_id=bill_id,
            is_deleted=False
        ).order_by('chunk_index')
        
        if not chunks.exists():
            logger.warning(f"No chunks with embeddings found for bill {bill_id}")
            return []
        
        similar_chunks = []
        
        for chunk in chunks:
            try:
                # Skip chunks without embeddings for now
                if not hasattr(chunk, 'embedding') or not chunk.embedding:
                    continue
                    
                # Extract embedding vector from stored data
                chunk_embedding = chunk.embedding.get('vector', [])
                
                if not chunk_embedding:
                    continue
                
                # Calculate similarity
                similarity = calculate_cosine_similarity(query_embedding, chunk_embedding)
                
                if similarity > 0.1:  # Minimum similarity threshold
                    similar_chunks.append({
                        'chunk_id': str(chunk.id),
                        'section_title': chunk.section_title,
                        'content': chunk.content,
                        'processed_content': chunk.processed_content or chunk.content,
                        'similarity_score': round(similarity, 3),
                        'chunk_order': chunk.chunk_index,
                        'character_count': len(chunk.content),
                        'embedding_info': {
                            'model': chunk.embedding.get('model', 'unknown'),
                            'is_placeholder': chunk.embedding.get('is_placeholder', False)
                        }
                    })
                    
            except Exception as e:
                logger.error(f"Error processing chunk {chunk.id}: {str(e)}")
                continue
        
        # Sort by similarity score (highest first)
        similar_chunks.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Return top results
        result = similar_chunks[:limit]
        
        logger.info(f"Found {len(result)} similar chunks for bill {bill_id} using embeddings")
        return result
        
    except Exception as e:
        logger.error(f"Error finding similar chunks by embedding: {str(e)}")
        return []


def fallback_keyword_search(bill_id: str, query: str, limit: int = 5) -> List[Dict]:
    """
    Fallback keyword search when embeddings not available
    This is the same logic used in chat_service.py for consistency
    
    Args:
        bill_id: Bill UUID string
        query: Search query
        limit: Maximum results
    Returns:
        list[dict]: Matching chunks
    """
    try:
        # Get all chunks for the bill
        chunks = BillChunk.objects.filter(
            bill_id=bill_id,
            is_deleted=False
        ).order_by('chunk_index')
        
        if not chunks.exists():
            return []
        
        query_lower = query.lower()
        
        # Extract keywords
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
        }
        
        import re
        keywords = []
        words = re.findall(r'\b\w+\b', query_lower)
        for word in words:
            if len(word) > 2 and word not in stop_words:
                keywords.append(word)
        
        # Priority terms for legal documents
        priority_terms = {
            'tax': 3.0, 'fee': 3.0, 'penalty': 3.0, 'fine': 3.0, 'money': 2.5,
            'citizen': 2.5, 'mwananchi': 2.5, 'right': 3.0, 'rights': 3.0
        }
        
        # Score chunks
        chunk_scores = []
        
        for chunk in chunks:
            score = 0.0
            search_text = (chunk.processed_content or chunk.content).lower()
            section_title = chunk.section_title.lower()
            
            # Keyword matching
            for keyword in keywords:
                title_matches = section_title.count(keyword)
                content_matches = search_text.count(keyword)
                multiplier = priority_terms.get(keyword, 1.0)
                score += (title_matches * 2.0 + content_matches * 1.0) * multiplier
            
            # Exact phrase match bonus
            if query_lower in search_text:
                score += 5.0
            
            if score > 0:
                chunk_scores.append({
                    'chunk_id': str(chunk.id),
                    'section_title': chunk.section_title,
                    'content': chunk.content,
                    'processed_content': chunk.processed_content or chunk.content,
                    'similarity_score': round(score / 10.0, 3),  # Normalize to 0-1 range
                    'chunk_order': chunk.chunk_index,
                    'character_count': len(chunk.content),
                    'search_method': 'keyword'
                })
        
        # Sort by score and return top results
        chunk_scores.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        result = chunk_scores[:limit]
        logger.info(f"Keyword search found {len(result)} chunks for bill {bill_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in fallback keyword search: {str(e)}")
        return []


def hybrid_search(bill_id: str, query: str, limit: int = 5) -> List[Dict]:
    """
    Combine embedding search with keyword search for better results
    
    Args:
        bill_id: Bill UUID string
        query: Search query
        limit: Maximum results
    Returns:
        list[dict]: Combined search results
    """
    try:
        # Try embedding search first
        query_embedding = generate_query_embedding(query)
        embedding_results = []
        
        if query_embedding:
            embedding_results = find_similar_chunks_by_embedding(
                bill_id, query_embedding, limit * 2  # Get more for combining
            )
            logger.info(f"Embedding search returned {len(embedding_results)} results")
        
        # Always do keyword search as backup/supplement
        keyword_results = fallback_keyword_search(bill_id, query, limit * 2)
        logger.info(f"Keyword search returned {len(keyword_results)} results")
        
        if not embedding_results:
            # Use keyword results only
            return keyword_results[:limit]
        
        if not keyword_results:
            # Use embedding results only  
            return embedding_results[:limit]
        
        # Combine results using a hybrid approach
        combined_results = {}
        
        # Add embedding results with higher weight for semantic similarity
        for result in embedding_results:
            chunk_id = result['chunk_id']
            combined_results[chunk_id] = result.copy()
            combined_results[chunk_id]['final_score'] = result['similarity_score'] * 0.7  # 70% weight
            combined_results[chunk_id]['has_embedding_match'] = True
        
        # Add/enhance with keyword results  
        for result in keyword_results:
            chunk_id = result['chunk_id']
            if chunk_id in combined_results:
                # Boost score if both methods found it
                combined_results[chunk_id]['final_score'] += result['similarity_score'] * 0.3  # 30% weight
                combined_results[chunk_id]['has_keyword_match'] = True
            else:
                # Add new keyword-only result
                combined_results[chunk_id] = result.copy()
                combined_results[chunk_id]['final_score'] = result['similarity_score'] * 0.5  # Lower weight for keyword-only
                combined_results[chunk_id]['has_keyword_match'] = True
                combined_results[chunk_id]['has_embedding_match'] = False
        
        # Sort by final score and return top results
        final_results = list(combined_results.values())
        final_results.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Clean up the results for return
        for result in final_results:
            result['similarity_score'] = result.pop('final_score')
            # Keep search method info for debugging
            if result.get('has_embedding_match') and result.get('has_keyword_match'):
                result['search_method'] = 'hybrid'
            elif result.get('has_embedding_match'):
                result['search_method'] = 'embedding'
            else:
                result['search_method'] = 'keyword'
            
            # Clean up temporary fields
            result.pop('has_embedding_match', None)
            result.pop('has_keyword_match', None)
        
        result = final_results[:limit]
        logger.info(f"Hybrid search returned {len(result)} combined results for bill {bill_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in hybrid search: {str(e)}")
        # Fallback to keyword search
        return fallback_keyword_search(bill_id, query, limit)


# API Endpoint for embedding generation (admin use)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_embeddings_endpoint(request, bill_id):
    """
    Admin endpoint to generate embeddings for a bill
    
    Args:
        bill_id: Bill UUID
        Request body: {
            'force_regenerate': bool (optional, default: false)
        }
    
    Returns: {
        'success': bool,
        'embeddings_generated': int,
        'message': str
    }
    """
    user = request.user
    
    # Only allow parliament admins to generate embeddings
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        force_regenerate = request.data.get('force_regenerate', False)
        
        result = generate_chunk_embeddings(bill_id, force_regenerate=force_regenerate)
        
        if result['success']:
            message = f"Generated {result['embeddings_generated']} embeddings"
            if result['skipped'] > 0:
                message += f" (skipped {result['skipped']} existing)"
                
            return Response({
                'success': True,
                'embeddings_generated': result['embeddings_generated'],
                'total_chunks': result.get('total_chunks', 0),
                'skipped': result['skipped'],
                'message': message,
                'bill_id': bill_id,
                'processing_info': result.get('processing_info', {})
            })
        else:
            return Response({
                'success': False,
                'error': result['error'],
                'message': 'Failed to generate embeddings'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Error in generate_embeddings_endpoint: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Endpoint error occurred'
        }, status=500)
