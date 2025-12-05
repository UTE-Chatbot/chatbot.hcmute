from app.services.rag_service.component.tools.document_search_tool import document_search_tool
from app.services.rag_service.component.tools.text2sql_tool import text2sql_tool
    
tools = [document_search_tool, text2sql_tool]
tools_by_name = {tool.name: tool for tool in tools}