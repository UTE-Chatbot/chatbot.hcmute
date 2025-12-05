import os
import io
import re
from typing import List, Union
from uuid import uuid4
from urllib.parse import unquote, urlparse
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from app.core.config import settings

# Initialize S3 client for MinIO
s3 = boto3.client(
    "s3",
    endpoint_url=settings.minio_endpoint,
    aws_access_key_id=settings.minio_access_key,
    aws_secret_access_key=settings.minio_secret_key,
    region_name="us-east-1"
)

def create_bucket_once():
    """
    Create MinIO bucket if it doesn't exist.
    Called on application startup.
    """
    try:
        s3.head_bucket(Bucket=settings.file_bucket_name)
        print(f"[MinIO] Bucket '{settings.file_bucket_name}' already exists")
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code')
        if error_code == '404':
            print(f"[MinIO] Creating bucket: {settings.file_bucket_name}")
            try:
                s3.create_bucket(Bucket=settings.file_bucket_name)
                print(f"[MinIO] Bucket '{settings.file_bucket_name}' created successfully")
            except ClientError as create_error:
                print(f"[MinIO] Error creating bucket: {create_error}")
                raise
        else:
            print(f"[MinIO] Error checking bucket: {e}")
            raise

def normalize_file_path(file_path: str) -> str:
    """
    Normalize file path by removing URL encoding and extracting the actual path.
    
    Handles:
    - URL-encoded paths
    - Full URLs with domain
    - API endpoint paths
    """
    file_path = unquote(file_path)
    
    if file_path.startswith(('http://', 'https://')):
        parsed = urlparse(file_path)
        path = parsed.path
        
        if '/api/v1/files/' in path:
            file_path = path.split('/api/v1/files/', 1)[1]
        else:
            file_path = path.lstrip('/')
    
    return file_path

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to ASCII-only, lowercase, with hyphens instead of spaces.
    
    Rules:
    1. Replace spaces with hyphens (-)
    2. Remove all non-ASCII characters
    3. Convert to lowercase
    4. Keep only alphanumeric, hyphens, underscores, and dots
    """
    # Get filename and extension
    name_parts = filename.rsplit('.', 1)
    name = name_parts[0]
    extension = name_parts[1] if len(name_parts) > 1 else ''
    
    # Replace spaces with hyphens
    name = name.replace(' ', '-')
    
    # Remove non-ASCII characters and keep only safe characters
    name = re.sub(r'[^a-zA-Z0-9._-]', '', name)
    
    # Convert to lowercase
    name = name.lower()
    extension = extension.lower()
    
    # Remove multiple consecutive hyphens
    name = re.sub(r'-+', '-', name)
    
    # Remove leading/trailing hyphens
    name = name.strip('-')
    
    # Ensure filename is not empty
    if not name:
        name = "unnamed"
    
    # Return with extension if present
    return f"{name}.{extension}" if extension else name

def upload_file(
    prefix: str,
    file: Union[UploadFile, None] = None,
    path: Union[str, None] = None,
    filename: Union[str, None] = None,
    file_id: Union[str, None] = None
):
    """
    Upload file to MinIO under a prefix (folder).
    
    Args:
        prefix: Folder prefix (e.g., "raw")
        base_url: Base URL for constructing public URL (e.g., "http://localhost:8000")
        file: FastAPI UploadFile object (if uploading from request)
        path: Local file path (e.g., /tmp/file.pdf) - alternative to file
        filename: Original filename (required if using path)
        file_id: Custom file ID (optional, will generate UUID if not provided)
    
    Returns:
        dict with keys: file_path, public_url, filename, bucket
    
    Example:
        # Upload from request
        upload_file(prefix="raw", base_url="http://localhost:8000", file=upload_file_obj)
        
        # Upload from local path
        upload_file(prefix="raw", base_url="http://localhost:8000", 
                   path="/tmp/document.pdf", filename="document.pdf")
    """
    # Validate inputs
    if file is None and path is None:
        raise ValueError("Either 'file' or 'path' must be provided")
    
    if path is not None and filename is None:
        raise ValueError("'filename' is required when using 'path'")
    
    # Generate file ID if not provided
    if file_id is None:
        file_id = str(uuid4())
    
    # Get filename
    if file is not None:
        original_filename = file.filename
    else:
        original_filename = filename
    
    # Sanitize filename
    base_url = settings.backend_url
    safe_filename = sanitize_filename(original_filename)
    key = f"{prefix}/{file_id}-{safe_filename}"
    
    try:
        if file is not None:
            # Upload from UploadFile object
            s3.upload_fileobj(file.file, settings.file_bucket_name, key)
        else:
            # Upload from local file path
            with open(path, 'rb') as f:
                s3.upload_fileobj(f, settings.file_bucket_name, key)
        
        # Construct public URL
        base_url = base_url.rstrip('/')
        public_url = f"{base_url}/api/v1/files/{key}"
        
        return {
            "file_path": key,
            "public_url": public_url,
            "filename": safe_filename,
            "bucket": settings.file_bucket_name
        }
    except ClientError as e:
        raise e
    except FileNotFoundError:
        raise Exception(f"Local file not found: {path}")

def list_files(prefix: str = "") -> List[str]:
    """List all files under a given prefix"""
    try:
        resp = s3.list_objects_v2(Bucket=settings.file_bucket_name, Prefix=prefix)
        return [item["Key"] for item in resp.get("Contents", [])]
    except ClientError as e:
        raise e

def get_file_stream(file_url: str) -> Union[io.BytesIO, None]:
    """
    Get file content as BytesIO stream from MinIO.
    
    Args:
        file_url: Can be either:
            - Full URL (e.g., "http://localhost:8000/api/v1/files/raw/uuid-file.pdf")
            - Partial path (e.g., "raw/uuid-file.pdf")
            - API path (e.g., "/api/v1/files/raw/uuid-file.pdf")
            
    Returns:
        io.BytesIO or None if file not found
    """
    # Normalize the file path/URL to get the storage key
    key = normalize_file_path(file_url)
    
    file_stream = io.BytesIO()
    try:
        s3.download_fileobj(settings.file_bucket_name, key, Fileobj=file_stream)
        file_stream.seek(0)
        return file_stream
    except ClientError:
        return None


def download_file(file_url: str):
    """
    Download a file as a StreamingResponse.
    
    Args:
        file_url: Can be either:
            - Full URL (e.g., "http://localhost:8000/api/v1/files/raw/uuid-file.pdf")
            - Partial path (e.g., "raw/uuid-file.pdf")
            - API path (e.g., "/api/v1/files/raw/uuid-file.pdf")
    
    Returns:
        StreamingResponse or None if file not found
    """
    file_stream = get_file_stream(file_url)
    
    if file_stream:
        return StreamingResponse(file_stream, media_type="application/octet-stream")
    return None

def delete_file(file_url: str):
    """
    Delete a file from MinIO.
    
    Args:
        file_url: Can be either:
            - Full URL (e.g., "http://localhost:8000/api/v1/files/raw/uuid-file.pdf")
            - Partial path (e.g., "raw/uuid-file.pdf")
            - API path (e.g., "/api/v1/files/raw/uuid-file.pdf")
    
    Returns:
        dict with deleted file key
    """
    # Normalize the file path/URL to get the storage key
    key = normalize_file_path(file_url)
    
    try:
        print(f"[MinIO] Attempting to delete file: {key}")
        s3.delete_object(Bucket=settings.file_bucket_name, Key=key)
        print(f"[MinIO] Successfully deleted file: {key}")
        return {"deleted": key}
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', str(e))
        print(f"[MinIO] Error deleting file {key}: {error_code} - {error_message}")
        raise Exception(f"Failed to delete file: {error_message}")

def get_presigned_url(key: str, expires: int = 3600):
    """
    Generate a temporary URL for direct download (expires in seconds)
    """
    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.file_bucket_name, "Key": key},
            ExpiresIn=expires
        )
        return {"url": url}
    except ClientError as e:
        raise e
