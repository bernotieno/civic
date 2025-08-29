# apps/api/utils.py
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
from django.core.files.uploadedfile import UploadedFile
from dotenv import load_dotenv
import os

load_dotenv()  # Load from .env

def summarize_bill_document(uploaded_file: UploadedFile) -> str:
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
                        {"role": "user", "content": f"Summarize this Kenyan parliamentary bill in simple English for citizens:\n\n{bill_text}"}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 500
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