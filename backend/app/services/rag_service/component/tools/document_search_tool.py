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
    Search documents in the vector store based on the query.
    Return the combined content of the top matching documents.
    Args:
        query (str): The search query.
    Returns:
        str: The combined content of the top matching documents.
    """
    return await doc_retriever_instance.execute(query)