# apps/api/utils.py
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
from django.core.files.uploadedfile import UploadedFile
from dotenv import load_dotenv
import os
import logging

# Import new enhanced functions
from .bill_processor import summarize_bill_document_enhanced, create_bill_chunks
from .progress_tracker import create_progress_callback, mark_bill_processing_complete

load_dotenv()  # Load from .env
logger = logging.getLogger(__name__)

def summarize_bill_document(uploaded_file: UploadedFile) -> str:
    """
    ORIGINAL FUNCTION - MAINTAINED FOR BACKWARD COMPATIBILITY
    
    Legacy bill document summarization function
    This function MUST continue working exactly as before to maintain
    backward compatibility with existing admin upload flow.
    
    Args:
        uploaded_file: Django UploadedFile object
    Returns:
        str: Summary text (markdown format)
    """
    try:
        # Try OpenAI API with urllib
        try:
            import urllib.request
            import urllib.parse
            import json
            
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                print(f"🤖 Attempting OpenAI summarization with direct API call...")
                
                reader = PyPDF2.PdfReader(uploaded_file)
                text = ''
                for page in reader.pages:
                    text += page.extract_text() or ''
                
                bill_text = text[:15000]
                print(f"📄 Extracted {len(bill_text)} characters for summarization")
                
                data = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "user", "content": f'''You are a legal analyst and public policy expert tasked with summarizing official government bills for the general Kenyan public.
                        Read and analyze the text below strictly without hallucinating or adding any information not found in the document.
                        Now perform the following:
                        1. Summarize the bill in clear, simple English that a non-expert Kenyan citizen can understand, avoiding legal or financial jargon.
                        2. Extract and list all key points section by section, but focus only on the provisions that directly affect or matter to citizens (e.g. taxes, levies, penalties, rights, employment laws, prices of goods, social services, education, health, etc.)
                        3. For each point, include:
                            - What is changing or being introduced
                            - Who it affects (e.g. citizens, workers, businesses, landlords, etc.)
                            - How it affects the who it affects
                            - If any, the increments or decrements in terms of percentage or statistics
                            - When it takes effect
                        4. Ensure the summary is accurate and comprehensive, but does not include irrelevant clauses, technical legal references, or duplicated provisions.
                        5. Use bullet points, headings, and short paragraphs to improve readability.
                        6. Only rely on the uploaded document. Do not add your own opinions or external sources.
                        7. Ensure the output is error-free, avoids hallucinations, and represents the true intent and impact of the bill.:\n\n{bill_text}'''}
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
                        print("🎉 OpenAI summarization completed successfully")
                        return result['choices'][0]['message']['content']
                    else:
                        print(f"❌ OpenAI API error: {response.status}")
                    
        except Exception as e:
            print(f"❌ OpenAI summarization failed: {str(e)}")
            pass
            
        # Fallback: Extract and format text
        reader = PyPDF2.PdfReader(uploaded_file)
        text = ''
        page_count = len(reader.pages)
        
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ''
            text += page_text
            
        # If no text extracted, provide file info
        if not text.strip():
            return f"Document uploaded successfully.\n\nFile info: {page_count} pages detected.\n\nNote: This PDF may contain images or scanned text that requires OCR processing. AI summarization is currently unavailable. Please review the document manually."
        
        # Create basic summary from extracted text
        preview = text[:1000].strip()
        return f"Document Summary:\n\nThis bill contains {len(text)} characters of legal text across {page_count} pages.\n\nKey content preview:\n\n{preview}...\n\nNote: AI summarization is currently unavailable. Please review the full document for complete details."
        
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
        if PyPDF2:
            try:
                reader = PyPDF2.PdfReader(uploaded_file)
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