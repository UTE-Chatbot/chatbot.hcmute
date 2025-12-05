# from typing import Optional
# from contextlib import asynccontextmanager
# from langchain.agents import create_agent
# from langchain_core.language_models.chat_models import BaseChatModel
# from langchain_core.tools import tool
# from langchain_core.messages import HumanMessage
# from langchain.agents.middleware import SummarizationMiddleware

# from app.services.rag_service.component.llms import get_cost_effective_chat_model, get_high_performance_chat_model
# from app.services.rag_service.component.prompt import SUPERVISOR_AGENT_PROMPT
# from app.services.rag_service.agent.table_agent import get_table_agent
# from app.services.rag_service.agent.doc_agent import search_documents_tool
# from app.core.config import settings
# from langchain_classic.tools.retriever import create_retriever_tool
# from langchain.agents.middleware import SummarizationMiddleware
# from app.db.checkpointer import get_checkpointer

# @tool
# async def query_database_tool(question: str) -> str:
#     """
#     Truy vấn thông tin từ cơ sở dữ liệu bảng biểu của trường.
#     """
#     table_agent = await get_table_agent()
#     result = await table_agent.ainvoke({"messages": [HumanMessage(content=question)]})
#     return result["messages"][-1].content


# async def create_supervisor_agent(
#     model: Optional[BaseChatModel] = None,
#     enable_summarization: bool = True,
#     summarization_trigger_tokens: int = 4000,
#     summarization_keep_messages: int = 20
# ):
#     if model is None:
#         model = get_high_performance_chat_model()
#     checkpointer = await get_checkpointer()
    
#     tools = [
#         query_database_tool,
#         search_documents_tool,
#     ]
#     checkpointer = await get_checkpointer()
#     agent = create_agent(
#         model,
#         tools,
#         system_prompt=SUPERVISOR_AGENT_PROMPT,
#         # checkpointer=checkpointer,
#         # middleware=[
#         #     SummarizationMiddleware(
#         #         model=settings.llm_cost_effective_model_name,
#         #         max_tokens_before_summary=4000,
#         #         messages_to_keep=20,
#         #     )
#         # ],
#     )
    
#     return agent
