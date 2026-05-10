import fitz  # PyMuPDF
import re

def extract_text_from_pdf(file_path: str) -> str:
    """
    Opens a PDF file, extracts the text page by page, 
    and performs basic cleaning to remove messy spacing.
    """
    try:
        doc = fitz.open(file_path)
        full_text = ""
        
        for page in doc:
            # Extract text from the current page
            text = page.get_text("text")
            
            # Clean up the text: replace multiple blank lines with a single blank line
            text = re.sub(r'\n\s*\n', '\n\n', text)
            full_text += text + "\n\n"
            
        return full_text.strip()
        
    except Exception as e:
        raise Exception(f"Failed to process PDF {file_path}: {str(e)}")