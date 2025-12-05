# from pydantic import BaseModel, Field
# from langchain_core.tools import StructuredTool

# from app.db.vector_db import vector_store


# class SearchDocumentsInput(BaseModel):
#     query: str = Field(description="Truy vấn tìm kiếm thông tin trong tài liệu")
#     top_k: int = Field(default=5, description="Số lượng tài liệu liên quan cần trả về")


# def search_documents_impl(query: str, top_k: int = 5) -> str:
#     retriever = vector_store.as_retriever(search_kwargs={"k": top_k})
#     docs = retriever.invoke(query)
    
#     if not docs:
#         return "Không tìm thấy tài liệu liên quan đến câu hỏi."
    
#     result_parts = []
#     for idx, doc in enumerate(docs, 1):
#         content = doc.page_content
#         doc_info = f"[Tài liệu {idx}]"
#         result_parts.append(f"{doc_info}\n{content}")
    
#     return "\n\n---\n\n".join(result_parts)


# search_documents_tool = StructuredTool.from_function(
#     func=search_documents_impl,
#     name="search_documents",
#     description="Tìm kiếm thông tin từ tài liệu và cơ sở tri thức của trường.",
#     args_schema=SearchDocumentsInput,
# )
