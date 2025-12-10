from app.db.vector_db import vector_store
class DocRetriever:
    def __init__(self):
        pass 
    
    async def execute(self, query: str) -> str:
        docs = await vector_store.asimilarity_search(query, k=10)
        combined_content = "\n".join([doc.page_content for doc in docs])
        return combined_content
from langchain.tools import tool
doc_retriever_instance = DocRetriever()

@tool
async def document_search_tool(query: str) -> str:
    """
    Tìm kiếm nội dung văn bản trong kho tài liệu (vector store) dựa trên truy vấn của người dùng hỏi về Trường.

    Mục đích:
        - Lấy các thông tin mô tả ngành, quy chế, thủ tục, hướng dẫn, thông báo, CSVC, đời sống sinh viên,...
        - Trả về phần nội dung kết hợp từ các tài liệu khớp nhất.

    Tham số:
        query (str): Câu truy vấn tìm kiếm tài liệu.

    Kết quả trả về:
        str: Nội dung tổng hợp của các tài liệu phù hợp nhất.
    """

    return await doc_retriever_instance.execute(query)