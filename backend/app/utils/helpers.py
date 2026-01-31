import os
from typing import Optional
from werkzeug.utils import secure_filename
from config import Config

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def get_file_extension(filename: str) -> Optional[str]:
    """Get file extension from filename"""
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    return None

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for security"""
    return secure_filename(filename)

def read_file_content(file_path: str) -> str:
    """Read file content safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

def validate_prompt_text(text: str) -> bool:
    """Validate prompt text"""
    if not text or not text.strip():
        return False
    if len(text.strip()) < 10:  # Minimum length requirement
        return False
    return True

def sanitize_mermaid_code(code: str) -> str:
    """Sanitize Mermaid code to remove invalid characters and fix syntax issues"""
    import re
    
    if not code:
        return code
    
    sanitized = code
    
    # Remove parentheses from node labels - replace with dashes
    # Pattern: [Label (text)] -> [Label - text]
    # Handle multiple parentheses in the same label
    while re.search(r'\[([^\]]*)\(([^)]*)\)([^\]]*)\]', sanitized):
        sanitized = re.sub(r'\[([^\]]*)\(([^)]*)\)([^\]]*)\]', r'[\1\3 - \2]', sanitized)
    
    # Remove triple backticks that might be in labels
    sanitized = sanitized.replace('```', '')
    
    # Fix common syntax issues: remove extra text/IDs after closing brackets on same line
    # Pattern: ...]        TEXT or ...]        ID -> ...]
    # This handles cases like: A[Label]        MCC -> A[Label]
    sanitized = re.sub(r'\]\s+([A-Z]{2,})\s*(\n|$)', r']\2', sanitized)
    
    # Remove any standalone text/IDs that appear after node definitions on the same line
    # Pattern: A[Label]ID -> A[Label]
    sanitized = re.sub(r'\]\s*([A-Z]{2,})\s*$', r']', sanitized, flags=re.MULTILINE)
    
    # Fix lines that have node definitions followed by invalid text
    # Pattern: A[Label] --> B[Label]        TEXT -> A[Label] --> B[Label]
    sanitized = re.sub(r'(-->[^\[\n]*\[[^\]]+\])\s+([A-Z]{2,})\s*(\n|$)', r'\1\3', sanitized)
    
    # Clean up multiple spaces (but preserve single spaces)
    sanitized = re.sub(r'[ \t]{2,}', ' ', sanitized)
    
    # Remove any lines that are just whitespace or invalid characters
    lines = sanitized.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Keep lines that have valid Mermaid syntax (nodes, arrows, etc.)
        if stripped and (
            '[' in stripped or 
            ']' in stripped or 
            '-->' in stripped or 
            'flowchart' in stripped.lower() or
            'graph' in stripped.lower() or
            re.match(r'^\s*[A-Z]+\s*[\[{]', stripped)  # Node definitions
        ):
            cleaned_lines.append(line)
        elif stripped and not re.match(r'^[^\w\[\]{}|-><]+$', stripped):
            # Keep other potentially valid lines
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()


def extract_mermaid_code_from_response(response: str) -> str:
    """Extract Mermaid code from AI model response and sanitize it"""
    try:
        # Remove first occurrence of ```mermaid
        if "```mermaid" in response:
            response = response.replace("```mermaid", "", 1)
        # Remove last occurrence of ```
        last_triple_tick = response.rfind("```")
        if last_triple_tick != -1:
            response = response[:last_triple_tick]
        
        # Extract and sanitize the code
        extracted = response.strip()
        sanitized = sanitize_mermaid_code(extracted)
        return sanitized
        # # Look for Mermaid code blocks
        # if '```mermaid' in response:
        #     start = response.find('```mermaid') + 10
        #     end = response.find('```', start)
        #     if end != -1:
        #         return response[start:end].strip()
        
        # # Look for flowchart TD (common Mermaid format)
        # if 'flowchart TD' in response:
        #     start = response.find('flowchart TD')
        #     # Find the end of the diagram (look for common endings)
        #     possible_endings = ['\n\n', '\n---', '\n##', '\n###']
        #     end = len(response)
        #     for ending in possible_endings:
        #         pos = response.find(ending, start)
        #         if pos != -1 and pos < end:
        #             end = pos
            
        #     return response[start:end].strip()
        
        # # If no clear markers, return the entire response
        # return response.strip()
    except Exception as e:
        # Ensure we don't return partial/broken strings
        # This will help prevent JSON serialization issues
        print(f"Error extracting Mermaid code: {str(e)}")
        return str(response).strip() 