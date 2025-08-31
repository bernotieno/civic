# apps/api/utils.py
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None
from django.core.files.uploadedfile import UploadedFile
from dotenv import load_dotenv
import os
import logging

# Import new enhanced functions
from .bill_processor import summarize_bill_document_enhanced, create_bill_chunks
from .progress_tracker import create_progress_callback, mark_bill_processing_complete

load_dotenv()  # Load from .env
logger = logging.getLogger(__name__)

def process_bill_document_complete(uploaded_file: UploadedFile, bill_instance) -> dict:
    """
    Complete bill processing: Summary + Chunking for AI chat
    
    This function does BOTH:
    1. Creates summary (markdown + HTML)
    2. Creates chunks for AI chat
    
    Returns:
        dict: {
            'success': bool,
            'summary_markdown': str,
            'summary_html': str,
            'chunks_created': int,
            'error': str (if failed)
        }
    """
    try:
        # Update progress: Starting
        bill_instance.processing_status = 'processing'
        bill_instance.processing_progress = 10
        bill_instance.processing_message = 'Extracting text from PDF...'
        bill_instance.save(update_fields=['processing_status', 'processing_progress', 'processing_message'])
        
        # Step 1: Extract text from PDF with multiple methods
        full_text = ''
        
        # Method 1: Try PyPDF2 first
        if PdfReader is not None:
            try:
                uploaded_file.seek(0)
                reader = PdfReader(uploaded_file)
                for page in reader.pages:
                    page_text = page.extract_text() or ''
                    if page_text.strip():
                        full_text += page_text + '\n\n'
                
                if full_text.strip():
                    logger.info(f"PyPDF2 successfully extracted {len(full_text)} characters")
            except Exception as e:
                logger.warning(f"PyPDF2 extraction failed: {e}")
        
        # Method 2: Try PyMuPDF if PyPDF2 failed
        if not full_text.strip():
            try:
                import fitz
                uploaded_file.seek(0)
                
                # Save to temporary file for PyMuPDF
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                    temp_file.write(uploaded_file.read())
                    temp_path = temp_file.name
                
                try:
                    doc = fitz.open(temp_path)
                    for page_num in range(len(doc)):
                        page = doc[page_num]
                        page_text = page.get_text()
                        if page_text.strip():
                            full_text += page_text + '\n\n'
                    doc.close()
                    
                    if full_text.strip():
                        logger.info(f"PyMuPDF successfully extracted {len(full_text)} characters")
                finally:
                    os.unlink(temp_path)
                    
            except ImportError:
                logger.warning("PyMuPDF not available")
            except Exception as e:
                logger.warning(f"PyMuPDF extraction failed: {e}")
        
        # Clean up the text
        full_text = full_text.strip()
        
        # If still no text, create a placeholder summary
        if not full_text:
            logger.warning("No text could be extracted from PDF - creating placeholder summary")
            
            # Create a basic summary indicating the document is available but text extraction failed
            placeholder_summary = f"""## {bill_instance.title}

**Document Status:** PDF document uploaded successfully

**Processing Note:** This appears to be a scanned or image-based PDF document. While the full document is available for download, automatic text extraction was not possible.

**What this means for citizens:**
- The complete bill document is available for download and review
- You can access the full PDF document through the document link
- Manual review of the document is recommended for complete details

**Document Information:**
- Sponsor: {bill_instance.sponsor}
- Status: {bill_instance.get_status_display()}
- Upload Date: {bill_instance.created_at.strftime('%B %d, %Y')}

**Next Steps:**
- Download and review the complete PDF document
- Participate in public consultation if the deadline is still open
- Contact your local representative for clarification on specific provisions

*Note: This summary was generated because automatic text extraction from the PDF was not possible. The full document remains available for download and contains all the detailed provisions of the bill.*"""
            
            # Update progress and create basic chunks
            bill_instance.processing_progress = 80
            bill_instance.processing_message = 'Creating document summary...'
            bill_instance.save(update_fields=['processing_progress', 'processing_message'])
            
            # Create HTML version
            placeholder_html = _convert_to_html(placeholder_summary)
            
            # Create a single chunk for the placeholder
            chunks_created = 1
            try:
                from apps.projects.models import BillChunk
                BillChunk.objects.filter(bill=bill_instance).delete()
                BillChunk.objects.create(
                    bill=bill_instance,
                    chunk_index=0,
                    section_title="Document Information",
                    content=placeholder_summary,
                    word_count=len(placeholder_summary.split())
                )
            except Exception as e:
                logger.error(f"Failed to create placeholder chunk: {e}")
                chunks_created = 0
            
            # Mark as completed with placeholder content
            bill_instance.summary = placeholder_summary
            bill_instance.summary_html = placeholder_html
            bill_instance.is_chunked = True
            bill_instance.total_chunks = chunks_created
            bill_instance.processing_status = 'completed'
            bill_instance.processing_progress = 100
            bill_instance.processing_message = 'Processing complete (document available for download)'
            bill_instance.save(update_fields=['summary', 'summary_html', 'is_chunked', 'total_chunks', 'processing_status', 'processing_progress', 'processing_message'])
            
            return {
                'success': True,
                'summary_markdown': placeholder_summary,
                'summary_html': placeholder_html,
                'chunks_created': chunks_created,
                'error': None
            }
        
        # Update progress: Text extracted
        bill_instance.processing_progress = 30
        bill_instance.processing_message = 'Creating summary...'
        bill_instance.save(update_fields=['processing_progress', 'processing_message'])
        
        # Step 2: Create summary
        summary_markdown = _create_summary(full_text)
        
        # Update progress: Summary created
        bill_instance.processing_progress = 60
        bill_instance.processing_message = 'Converting to HTML...'
        bill_instance.save(update_fields=['processing_progress', 'processing_message'])
        
        # Step 3: Convert to HTML (simple conversion)
        summary_html = _convert_to_html(summary_markdown)
        
        # Update progress: HTML created
        bill_instance.processing_progress = 80
        bill_instance.processing_message = 'Creating chunks for AI chat...'
        bill_instance.save(update_fields=['processing_progress', 'processing_message'])
        
        # Step 4: Create chunks for AI chat
        chunks_created = create_bill_chunks(full_text, bill_instance)
        
        # Update progress: Finalizing
        bill_instance.processing_progress = 95
        bill_instance.processing_message = 'Finalizing...'
        bill_instance.save(update_fields=['processing_progress', 'processing_message'])
        
        # Step 5: Update bill with chunking info
        bill_instance.is_chunked = True
        bill_instance.total_chunks = chunks_created
        bill_instance.processing_status = 'completed'
        bill_instance.processing_progress = 100
        bill_instance.processing_message = 'Processing complete'
        bill_instance.save(update_fields=['is_chunked', 'total_chunks', 'processing_status', 'processing_progress', 'processing_message'])
        
        return {
            'success': True,
            'summary_markdown': summary_markdown,
            'summary_html': summary_html,
            'chunks_created': chunks_created,
            'error': None
        }
        
    except Exception as e:
        # Update progress: Failed
        bill_instance.processing_status = 'failed'
        bill_instance.processing_progress = 0
        bill_instance.processing_message = f'Processing failed: {str(e)}'
        bill_instance.save(update_fields=['processing_status', 'processing_progress', 'processing_message'])
        
        return {
            'success': False,
            'summary_markdown': '',
            'summary_html': '',
            'chunks_created': 0,
            'error': str(e)
        }


def _create_summary(full_text: str) -> str:
    """
    Create summary from extracted text - ONLY for this specific bill
    """
    try:
        # Clean and limit text to avoid cross-contamination
        clean_text = full_text.strip()
        
        # Try OpenAI API
        import urllib.request
        import json
        
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and clean_text:
            try:
                # Take first 4000 chars to ensure we stay within limits
                bill_text = clean_text[:4000]
                
                data = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are summarizing ONE specific Kenyan bill. Generate HTML formatted output for web display. Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> for formatting."},
                        {"role": "user", "content": f'''Summarize ONLY this specific bill in simple English for citizens. Format the output as clean HTML with proper headings, paragraphs, and lists. Focus on key impacts like taxes, penalties, rights, and services. Structure it with clear sections:\n\n{bill_text}'''}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 600
                }
                
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=json.dumps(data).encode('utf-8'),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                with urllib.request.urlopen(req, timeout=15) as response:
                    if response.status == 200:
                        result = json.loads(response.read().decode('utf-8'))
                        summary = result['choices'][0]['message']['content']
                        return summary.strip()
            except Exception as api_error:
                logger.warning(f"OpenAI API call failed: {api_error}")
        else:
            logger.info("No OpenAI API key found, using fallback summary")
    except Exception as e:
        logger.warning(f"AI summarization setup failed: {e}")
    
    # Enhanced fallback: Create a structured summary from the document
    try:
        # Extract key sections and create a basic summary
        lines = clean_text.split('\n')
        
        # Look for common bill sections
        sections = []
        current_section = ""
        
        for line in lines[:100]:  # First 100 lines
            line = line.strip()
            if line and (line.isupper() or line.startswith('PART') or line.startswith('SECTION')):
                if current_section:
                    sections.append(current_section)
                current_section = line
            elif line and current_section:
                current_section += f" {line}"
        
        if current_section:
            sections.append(current_section)
        
        # Create structured HTML summary
        summary_parts = [
            "<h2>Bill Summary</h2>",
            f"<p>This bill contains {len(clean_text)} characters of legal text.</p>",
            "<h3>Key Sections:</h3>",
            "<ul>"
        ]
        
        for section in sections[:5]:  # Top 5 sections
            summary_parts.append(f"<li>{section[:200]}...</li>")
        
        if len(sections) > 5:
            summary_parts.append(f"<li><em>... and {len(sections) - 5} more sections</em></li>")
        
        summary_parts.extend([
            "</ul>",
            "<h3>Document Preview:</h3>",
            f"<p>{clean_text[:500]}...</p>",
            "<p><em>Note: AI summarization is currently unavailable. Please review the full document for complete details.</em></p>"
        ])
        
        return "\n".join(summary_parts)
        
    except Exception as fallback_error:
        logger.error(f"Fallback summary creation failed: {fallback_error}")
        # Ultimate fallback
        preview = clean_text[:800].strip()
        return f"Document Summary: This bill contains {len(clean_text)} characters of legal text. Key content preview: {preview}... Note: AI summarization is currently unavailable."


def _convert_to_html(text: str) -> str:
    """
    Convert text to HTML - if already HTML, return as is
    """
    if not text:
        return ''
    
    # If text already contains HTML tags, return as is
    if '<' in text and '>' in text:
        return text
    
    # Simple conversion: paragraphs and line breaks
    html = text.replace('\n\n', '</p><p>')
    html = html.replace('\n', '<br>')
    html = f'<p>{html}</p>'
    
    # Clean up empty paragraphs
    html = html.replace('<p></p>', '')
    html = html.replace('<p><br></p>', '')
    
    return html


def create_bill_chunks(text: str, bill_instance) -> int:
    """
    Create chunks for AI chat from bill text
    
    Args:
        text: Full bill text
        bill_instance: Bill model instance
    
    Returns:
        int: Number of chunks created
    """
    try:
        from apps.projects.models import BillChunk
        
        # Clear existing chunks
        BillChunk.objects.filter(bill=bill_instance).delete()
        
        # Clean text first
        clean_text = text.strip()
        
        # Simple chunking: split by paragraphs, max 1000 chars per chunk
        paragraphs = [p.strip() for p in clean_text.split('\n\n') if p.strip()]
        chunks = []
        current_chunk = ''
        
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) > 1000 and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = paragraph
            else:
                current_chunk += '\n\n' + paragraph if current_chunk else paragraph
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Create chunk objects
        chunk_objects = []
        for i, chunk_text in enumerate(chunks):
            if chunk_text.strip():  # Only create non-empty chunks
                chunk_objects.append(BillChunk(
                    bill=bill_instance,
                    chunk_index=i,
                    content=chunk_text,
                    word_count=len(chunk_text.split())
                ))
        
        BillChunk.objects.bulk_create(chunk_objects)
        return len(chunk_objects)
        
    except Exception as e:
        logger.error(f"Failed to create chunks for bill {bill_instance.id}: {e}")
        return 0


def summarize_bill_document(uploaded_file: UploadedFile) -> str:
    """
    LEGACY FUNCTION - For backward compatibility only
    """
    try:
        if PdfReader is None:
            return "PDF processing library not available."
        
        reader = PdfReader(uploaded_file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''
        
        if not text.strip():
            return "No text could be extracted from PDF."
        
        return _create_summary(text)
        
    except Exception as e:
        return f"Document processing failed: {str(e)}"


def process_bill_with_enhanced_features(uploaded_file: UploadedFile, bill_instance, use_enhanced: bool = True) -> dict:
    """
    NEW ENHANCED FUNCTION - Process bill with progress tracking and HTML output
    
    This function provides enhanced processing while maintaining backward compatibility.
    Falls back to original function if enhanced processing fails.
    
    Args:
        uploaded_file: Django UploadedFile object
        bill_instance: Bill model instance for progress tracking
        use_enhanced: Whether to use enhanced processing (default: True)
    Returns:
        dict: {
            'success': bool,
            'summary_markdown': str,
            'summary_html': str,
            'sections_count': int,
            'chunks_created': int,
            'error': str (if failed),
            'used_enhanced': bool
        }
    """
    bill_id = str(bill_instance.id)
    
    # Create progress callback
    progress_callback = create_progress_callback(bill_id)
    
    if use_enhanced:
        try:
            # Try enhanced processing
            logger.info(f"Starting enhanced processing for bill {bill_id}")
            progress_callback('extracting', 5, 'Starting enhanced processing...')
            
            # Process with enhanced function
            result = summarize_bill_document_enhanced(
                uploaded_file, 
                bill_id=bill_id, 
                progress_callback=progress_callback
            )
            
            if result['success']:
                # Create chunks for future chat functionality
                progress_callback('completing', 98, 'Creating chunks for chat...')
                
                # Extract text again for chunking (could be optimized in Phase 2)
                from .bill_processor import extract_pdf_text_with_progress
                text, _ = extract_pdf_text_with_progress(uploaded_file)
                chunks_created = create_bill_chunks(text, bill_instance)
                
                # Update bill with chunking info
                bill_instance.is_chunked = True
                bill_instance.total_chunks = chunks_created
                bill_instance.save(update_fields=['is_chunked', 'total_chunks'])
                
                # Mark as complete
                mark_bill_processing_complete(bill_id, success=True)
                progress_callback('completed', 100, 'Enhanced processing complete!')
                
                return {
                    'success': True,
                    'summary_markdown': result['summary_markdown'],
                    'summary_html': result['summary_html'],
                    'sections_count': result['sections_count'],
                    'chunks_created': chunks_created,
                    'error': None,
                    'used_enhanced': True
                }
            else:
                # Enhanced processing failed, fall back to original
                logger.warning(f"Enhanced processing failed for bill {bill_id}, falling back to original")
                raise Exception(result['error'])
                
        except Exception as e:
            # Enhanced processing failed, fall back to original
            logger.error(f"Enhanced processing failed for bill {bill_id}: {str(e)}")
            progress_callback('processing', 50, 'Enhanced processing failed, using fallback...')
    
    # Fallback to original function
    try:
        logger.info(f"Using original processing for bill {bill_id}")
        progress_callback('processing', 60, 'Processing with original method...')
        
        # Use original function
        summary_markdown = summarize_bill_document(uploaded_file)
        
        # Convert markdown to HTML using new function
        from .bill_processor import markdown_to_html
        summary_html = markdown_to_html(summary_markdown)
        
        # Mark as complete
        mark_bill_processing_complete(bill_id, success=True)
        progress_callback('completed', 100, 'Processing complete!')
        
        return {
            'success': True,
            'summary_markdown': summary_markdown,
            'summary_html': summary_html,
            'sections_count': 1,
            'chunks_created': 0,
            'error': None,
            'used_enhanced': False
        }
        
    except Exception as e:
        # Both methods failed
        error_msg = f"All processing methods failed: {str(e)}"
        logger.error(f"Complete processing failure for bill {bill_id}: {error_msg}")
        
        mark_bill_processing_complete(bill_id, success=False, error_message=error_msg)
        progress_callback('failed', 0, error_msg)
        
        return {
            'success': False,
            'summary_markdown': '',
            'summary_html': '',
            'sections_count': 0,
            'chunks_created': 0,
            'error': error_msg,
            'used_enhanced': False
        }


def validate_pdf_file(uploaded_file: UploadedFile) -> dict:
    """
    Validate uploaded PDF file before processing
    Args:
        uploaded_file: Django UploadedFile object
    Returns:
        dict: {
            'valid': bool,
            'page_count': int,
            'file_size': int,
            'errors': list[str]
        }
    """
    errors = []
    page_count = 0
    file_size = uploaded_file.size
    
    try:
        # Check file extension
        if not uploaded_file.name.lower().endswith('.pdf'):
            errors.append("File must be a PDF")
        
        # Check file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if file_size > max_size:
            errors.append(f"File too large ({file_size / 1024 / 1024:.1f}MB). Maximum size is 50MB.")
        
        # Try to read PDF
        if PdfReader:
            try:
                reader = PdfReader(uploaded_file)
                page_count = len(reader.pages)
                
                if page_count == 0:
                    errors.append("PDF appears to be empty")
                elif page_count > 500:
                    errors.append(f"PDF too large ({page_count} pages). Maximum is 500 pages.")
                
                # Reset file pointer
                uploaded_file.seek(0)
                
            except Exception as e:
                errors.append(f"Could not read PDF: {str(e)}")
        else:
            errors.append("PDF processing library not available")
        
    except Exception as e:
        errors.append(f"File validation error: {str(e)}")
    
    return {
        'valid': len(errors) == 0,
        'page_count': page_count,
        'file_size': file_size,
        'errors': errors
    }


# # apps/api/utils.py
# try:
#     import PyPDF2
# except ImportError:
#     PyPDF2 = None
# from django.core.files.uploadedfile import UploadedFile
# from dotenv import load_dotenv
# import os

# load_dotenv()  # Load from .env

# def summarize_bill_document(uploaded_file: UploadedFile) -> str:
#     try:
#         # Try OpenAI API with urllib
#         try:
#             import urllib.request
#             import urllib.parse
#             import json
            
#             api_key = os.getenv("OPENAI_API_KEY")
#             if api_key:
#                 print(f"🤖 Attempting OpenAI summarization with direct API call...")
                
#                 reader = PyPDF2.PdfReader(uploaded_file)
#                 text = ''
#                 for page in reader.pages:
#                     text += page.extract_text() or ''
                
#                 bill_text = text[:15000]
#                 print(f"📄 Extracted {len(bill_text)} characters for summarization")
                
#                 data = {
#                     "model": "gpt-4o-mini",
#                     "messages": [
#                         {"role": "user", "content": f'''You are a legal analyst and public policy expert tasked with summarizing official government bills for the general Kenyan public.
#                         Read and analyze the text below strictly without hallucinating or adding any information not found in the document.
#                         Now perform the following:
#                         1. Summarize the bill in clear, simple English that a non-expert Kenyan citizen can understand, avoiding legal or financial jargon.
#                         2. Extract and list all key points section by section, but focus only on the provisions that directly affect or matter to citizens (e.g. taxes, levies, penalties, rights, employment laws, prices of goods, social services, education, health, etc.)
#                         3. For each point, include:
#                             - What is changing or being introduced
#                             - Who it affects (e.g. citizens, workers, businesses, landlords, etc.)
#                             - How it affects the who it affects
#                             - If any, the increments or decrements in terms of percentage or statistics
#                             - When it takes effect
#                         4. Ensure the summary is accurate and comprehensive, but does not include irrelevant clauses, technical legal references, or duplicated provisions.
#                         5. Use bullet points, headings, and short paragraphs to improve readability.
#                         6. Only rely on the uploaded document. Do not add your own opinions or external sources.
#                         7. Ensure the output is error-free, avoids hallucinations, and represents the true intent and impact of the bill.:\n\n{bill_text}'''}
#                     ],
#                     "temperature": 0.7,
#                     "max_tokens": 1500
#                 }
                
#                 req = urllib.request.Request(
#                     "https://api.openai.com/v1/chat/completions",
#                     data=json.dumps(data).encode('utf-8'),
#                     headers={
#                         "Authorization": f"Bearer {api_key}",
#                         "Content-Type": "application/json"
#                     }
#                 )
                
#                 with urllib.request.urlopen(req, timeout=30) as response:
#                     if response.status == 200:
#                         result = json.loads(response.read().decode('utf-8'))
#                         print("🎉 OpenAI summarization completed successfully")
#                         return result['choices'][0]['message']['content']
#                     else:
#                         print(f"❌ OpenAI API error: {response.status}")
                    
#         except Exception as e:
#             print(f"❌ OpenAI summarization failed: {str(e)}")
#             pass
            
#         # Fallback: Extract and format text
#         reader = PyPDF2.PdfReader(uploaded_file)
#         text = ''
#         page_count = len(reader.pages)
        
#         for i, page in enumerate(reader.pages):
#             page_text = page.extract_text() or ''
#             text += page_text
            
#         # If no text extracted, provide file info
#         if not text.strip():
#             return f"Document uploaded successfully.\n\nFile info: {page_count} pages detected.\n\nNote: This PDF may contain images or scanned text that requires OCR processing. AI summarization is currently unavailable. Please review the document manually."
        
#         # Create basic summary from extracted text
#         preview = text[:1000].strip()
#         return f"Document Summary:\n\nThis bill contains {len(text)} characters of legal text across {page_count} pages.\n\nKey content preview:\n\n{preview}...\n\nNote: AI summarization is currently unavailable. Please review the full document for complete details."
        
#     except Exception as e:
#         return f"Document processing failed: {str(e)}"