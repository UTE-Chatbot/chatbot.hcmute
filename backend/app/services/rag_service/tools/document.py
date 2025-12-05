from langchain.tools import tool 
from app.db.vector_db import vector_store
@tool 
def search_documents_tool(query: str) -> str:
    """
    Tìm kiếm thông tin từ tài liệu và cơ sở tri thức của trường.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 10})
    docs = retriever.invoke(query)
    
    if not docs:
        return "Không tìm thấy tài liệu liên quan đến câu hỏi."
    
    result_parts = []
    for idx, doc in enumerate(docs, 1):
        content = doc.page_content
        doc_info = f"[Tài liệu {idx}]"
        result_parts.append(f"{doc_info}\n{content}")
    
    return "\n\n---\n\n".join(result_parts)