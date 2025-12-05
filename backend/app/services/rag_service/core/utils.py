def format_docs(docs):  
    return "\n\n".join(doc.page_content for doc in docs)
from pydantic import BaseModel
