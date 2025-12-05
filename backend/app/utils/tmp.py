import tempfile
import os
import httpx
from pathlib import Path
from urllib.parse import urlparse, unquote

async def download_temp_file(url: str, suffix: str = ".pdf") -> str:
    """
    Download a file from URL to a temporary directory with a random parent folder
    but keeping the original filename.
    
    Args:
        url: URL to download from
        suffix: File extension (default: .pdf)
    
    Returns:
        Path to the downloaded temporary file
    
    Example:
        /tmp/randomXYZ123/document.pdf
        The parent folder (randomXYZ123) is random
        The filename (document.pdf) is preserved from URL or uses suffix
    """
    # Create a random temporary directory
    temp_dir = tempfile.mkdtemp(prefix="chatbot_")
    
    # Extract filename from URL or generate one
    parsed_url = urlparse(url)
    original_filename = os.path.basename(unquote(parsed_url.path))
    
    # If no filename in URL or it doesn't have an extension, use suffix
    if not original_filename or '.' not in original_filename:
        original_filename = f"document{suffix}"
    
    # Construct full path: /tmp/randomXYZ123/original_filename.pdf
    file_path = os.path.join(temp_dir, original_filename)
    
    # Download file asynchronously
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        
        # Write to file
        with open(file_path, 'wb') as f:
            f.write(response.content)
    
    return file_path
