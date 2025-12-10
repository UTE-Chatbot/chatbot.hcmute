import os
import tempfile
import httpx
from uuid import uuid4
from docx import Document
from datalab_sdk import DatalabClient
from datalab_sdk.models import ConvertOptions
from markitdown import MarkItDown
from app.core.config import settings
from app.services.minio_service import upload_file
from app.utils.tmp import download_temp_file


class DocumentParser:
    def __init__(self, storage_prefix="parser-uploads"):
        self.storage_prefix = storage_prefix
        self.uploaded_map = {}

    def _handle_docx(self, docx_path):
        try:
            doc_stem = os.path.splitext(os.path.basename(docx_path))[0]
        except Exception:
            doc_stem = "document"

        if not doc_stem:
            doc_stem = "document"

        doc = Document(docx_path)
        
        for p in doc.paragraphs:
            for r in p.runs:
                blips = r.element.xpath(".//a:blip")
                if blips:
                    blip = blips[0]
                    embed_code = blip.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                    
                    if embed_code in doc.part.rels:
                        rel = doc.part.rels[embed_code]
                        
                        if embed_code in self.uploaded_map:
                            public_url = self.uploaded_map[embed_code]
                        else:
                            image_part = rel.target_part
                            image_bytes = image_part.blob
                            
                            content_type = image_part.content_type
                            ext = content_type.split('/')[-1] if '/' in content_type else "png"
                            img_filename = f"{doc_stem}_extracted_image.{ext}"
                            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp_img:
                                tmp_img.write(image_bytes)
                                tmp_img_path = tmp_img.name

                            upload_result = upload_file(
                                path=tmp_img_path,
                                prefix=self.storage_prefix,
                                filename=img_filename
                            )
                            public_url = upload_result['public_url']
                            self.uploaded_map[embed_code] = public_url
                            
                            os.remove(tmp_img_path)

                        alt_text = "Image"
                        doc_pr_list = blip.xpath("ancestor::wp:inline/wp:docPr")
                        if not doc_pr_list:
                            doc_pr_list = blip.xpath("ancestor::wp:anchor/wp:docPr")
                            
                        if doc_pr_list:
                            doc_pr = doc_pr_list[0]
                            raw_alt = doc_pr.get("descr") or doc_pr.get("title")
                            if raw_alt:
                                alt_text = raw_alt
                        alt_text = alt_text.replace("[", "").replace("]", "").replace("\n", " ").strip()
                        md_text = f"![{alt_text}]({public_url})"
                        r.text = md_text
                        drawings = r.element.xpath(".//w:drawing")
                        for d in drawings:
                            d.getparent().remove(d)

        temp_docx_handle, temp_docx_path = tempfile.mkstemp(suffix=".docx")
        os.close(temp_docx_handle)
        doc.save(temp_docx_path)

        md_converter = MarkItDown()
        result = md_converter.convert(temp_docx_path)
        
        os.remove(temp_docx_path)
        return result.text_content, None

    async def _handle_external(self, file_path):
        client = DatalabClient(api_key=settings.datalab_api_key)
        options = ConvertOptions(
            output_format="markdown",
            force_ocr=True,
            disable_image_extraction=True
        )
        temp_output_dir = tempfile.mkdtemp(prefix="datalab_output_")
        result = await client._async_client.convert(file_path, options=options)
        result.save_output(temp_output_dir, save_images=False)
        return result.markdown, temp_output_dir

    async def process(self, input_url):
        tmp_path = await download_temp_file(input_url)
        file_ext = os.path.splitext(tmp_path)[1].lower()
        
        if file_ext == ".docx":
            text_content, _ = self._handle_docx(tmp_path)
            os.remove(tmp_path)
            return text_content
        else:
            text_content, output_dir = await self._handle_external(tmp_path)
            os.remove(tmp_path)
            if output_dir and os.path.exists(output_dir):
                for f in os.listdir(output_dir):
                    os.remove(os.path.join(output_dir, f))
                os.rmdir(output_dir)
            return text_content