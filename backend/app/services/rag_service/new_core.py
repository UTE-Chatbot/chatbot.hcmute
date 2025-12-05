import uuid
from langgraph.graph import MessagesState, StateGraph, START, END
from typing import  List, Optional, Literal
from app.services.rag_service.component.chat_history import ChatHistory 
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, RemoveMessage
from app.services.rag_service.component.prompt import *

class AgentState(MessagesState):
    question: str
    thread_id: str
    rewritten_question: Optional[str]
    summary: Optional[str]
    context: Optional[List[str]]
    response: Optional[str]
    cache_hit: Optional[bool] = None

def format_docs(docs):  
    return "\n\n".join(doc.page_content for doc in docs)
from pydantic import BaseModel
class MessageSchema(BaseModel):
    role: str
    content: str

from app.services.rag_service.component.llms import get_cost_effective_chat_model, get_high_performance_chat_model
from app.db.checkpointer import get_checkpointer

from langchain.agents import create_agent
from app.db.vector_db import vector_store
# from app.services.rag_service.tools.document import search_documents_tool 
# from app.services.rag_service.agent.supervisor_agent import query_database_tool


# Define tools
@tool
def search_doc(query:str) -> str:
    """Find the relevant doc based on user query

    Args:
      query: str
    """
    return f"Doc for query: CNTT o truogn dh spkt giang day ve 4 chuyen nganh"

@tool
def text2sql_db(query:str) -> str:
  """Find the relevant tabular data or information saved in database about HCMUTE"""

  return f"Data: Diem chuan spkt de vao cntt 2024 la 25, 2025 la 26 (to hop A01)"


# Augment the LLM with tools
tools = [search_doc, text2sql_db]
tools_by_name = {tool.name: tool for tool in tools}

class RAG: 
    def __init__(self):   
        self.chat_memory = ChatHistory()
        self.rewrite_llm = get_cost_effective_chat_model()
        self.summarizer_llm = get_cost_effective_chat_model()
        self.llm = get_high_performance_chat_model()
        self.retriever = vector_store
        self.history = None
        self.max_history = None
        self.graph = None
        self.conn = None 
        self.llm_with_tools = self.llm.bind_tools(tools)
        
    @classmethod
    async def create(cls):
        self = cls()
        await self.init_workflow()
        return self

    async def llm_with_tools(self, state: AgentState):
        invocation_messages = [ SystemMessage( content="Nên sử dụng cả hai công cụ để cho ra câu trả lời chất lượng nếu bạn thấy cần và đưa ra các thông tin tốt nhất liên quan nhất dựa trên những gì bạn có được. Bạn là chuyên viên tư vấn tuyển sinh của Trường Đại Học Sư Phạm Kỹ Thuật - Thành Phố Hồ Chí Minh. Bạn có nhiệm vụ trả lời câu hỏi của người dùng về các thông tin liên quan đến tuyển sinh của trường. Bạn được huấn luyện để trả lời các câu hỏi liên quan đến tuyển sinh của trường. Bạn có thể tham khảo các tài liệu sau đây để trả lời câu hỏi của người dùng. Lưu ý quan trọng: - Định dạng câu trả lời theo dạng markdown, gạch đầu dòng, liên kế theo ý. KHÔNG ĐƯỢC THÊM DẤU `---` ở giữa các đoạn. Phân chia các ý trong câu trả lời rõ ràng. - Nếu dữ liệu cung cấp có liên kết ảnh, video, tài liệu tham khảo, BẠN PHẢI CUNG CẤP CHO NGƯỜI DÙNG ĐỂ HỌ CÓ THỂ XEM THÊM. Ảnh và video nên format là markdown (![Văn bản mô tả video này](link)) - Các công thức toán học nên format là markdown Latex inline dùng `$` và block dùng `$$`. - Trả lời câu hỏi của người dùng một cách chính xác và đầy đủ nhất có thể. - Không được tự ý thêm thông tin không có trong tài liệu. - Thái độ thân thiện, lịch sự và chuyên nghiệp. - Không cần hỏi lại để người dùng xác nhận lại câu hỏi. - Dựa vào tóm tắt để trả lời câu hỏi của người dùng mà không cần đọc lại toàn bộ nội dung cuộc hội thoại." ) ] + state["messages"]
        response_message = await self.llm_with_tools.ainvoke(invocation_messages)
        response = response_message.content
        return {**state, "messages": [response_message], "response": response}

    async def tool_node(state: AgentState):
        messages = state["messages"]
        last_message = messages[-1]

        result = []
        for tool_call in last_message.tool_calls:
            print(f"CALLED TOOL: {tool_call['name']}")
            
            if tool_call["name"] in self.tools_by_name:
                tool = self.tools_by_name[tool_call["name"]]
                observation = await tool.ainvoke(tool_call["args"])
            else:
                observation = "Error: Tool not found."
                
            result.append(ToolMessage(content=str(observation), tool_call_id=tool_call["id"]))
            
        return {**state, "messages": result}

        
    def route_tools(self, state: AgentState) -> Literal["tool_node", "update_chat_history"]:
            """
            Decide if we go to tool_node or finish generation (update history).
            """
            messages = state["messages"]
            last_message = messages[-1]

            # If the LLM makes a tool call, go to tools
            if last_message.tool_calls:
                return "tool_node"

            return "update_chat_history"



    
    async def init_workflow(self):
        workflow = StateGraph(AgentState)
        
        # 1. Define Nodes
        workflow.add_node("rewrite_question", self.rewrite_question)
        workflow.add_node("call_model", self.call_model) # Replaces generate_response
        workflow.add_node("tool_node", self.tool_node)
        workflow.add_node("update_chat_history", self.update_chat_history)
        workflow.add_node("summarize_conversation", self.summarize_conversation)
        
        # 2. Define Edges
        workflow.add_edge(START, "rewrite_question")
        
        # From rewrite, go to the agent loop
        workflow.add_edge("rewrite_question", "call_model")
        
        # 3. Define Conditional Edges for Agent Loop
        workflow.add_conditional_edges(
            "call_model",
            self.route_tools,
            {
                "tool_node": "tool_node",
                "update_chat_history": "update_chat_history"
            }
        )
        
        # From tools, ALWAYS go back to model to interpret results
        workflow.add_edge("tool_node", "call_model")
        
        # 4. Post-Generation Logic
        workflow.add_conditional_edges(
            "update_chat_history",
            self.should_summarize,
            {
                "summarize_conversation": "summarize_conversation",
                END: END
            }
        )
        
        workflow.add_edge("summarize_conversation", END)
        checkpointer = await get_checkpointer()
        self.graph = workflow.compile(checkpointer=checkpointer)
        print("Graph initialized successfully")

    async def check_cache(self, state: AgentState) -> AgentState:
        # rewritten_question = state.get("rewritten_question", "")
        # if not rewritten_question:
        #     return {**state, "cache_hit": False}
        # cached_response = await self.semantic_cache.search_cache_async(rewritten_question)
        # if cached_response is not None:
        #     messages = state.get("messages", [])
        #     messages.append(AIMessage(content=cached_response))
        #     return {**state, "response": cached_response, "cache_hit": True, "messages": messages}
        # else:
        #     return {**state, "cache_hit": False}
        return {**state, "cache_hit": False}

    def should_retrieve_or_skip(self, state: AgentState):
        return "update_chat_history" if state.get("cache_hit", False) else "retrieve_documents"

    async def rewrite_question(self, state: AgentState) -> AgentState:
        question = state.get("question", "")

        if "summary" in state:
            summary = state["summary"]
        else:
            summary = "Không có tóm tắt cuộc trò chuyện "
       
        messages = state.get("messages", [])
        converstation_context = "\n\n".join(
            [message.content for message in messages if isinstance(message, HumanMessage)]
        )
        
        converstation_context = converstation_context + "\n\n" + summary
            
        system_message = SystemMessage(content=LLM_REWRITE_PROMPT.format(
            converstation_context=converstation_context,
            question=question
        ))
        rewritten_question = await self.rewrite_llm.ainvoke([system_message])
        return {**state, "rewritten_question": rewritten_question.content}


    async def retrieve_documents(self, state: AgentState) -> AgentState:
        # Do not retrieve if cache hit
        if state.get("cache_hit", False):
            # Just return state as-is, skip retrieval
            return state
        # question = state.get("rewritten_question", "")
        # intent = await self.classifier.classify(question)
        # print("ORIGINAL QUESTION: ", question)
        # print("REWRITTEN QUESTION: ", state.get("rewritten_question", ""))
        # print(f"INTENT_CLASS: {intent} { ChatIntent.DIEM_CHUAN.value}")
        # print("INTENT_CLASS CHECK",  ChatIntent.DIEM_CHUAN.value==intent)
        # retrieve_k = 5
        # local_time = time.localtime()
        # formatted_date = time.strftime("%Y-%m-%d", local_time)
        # time_document = Document(
        #     page_content=f"Hôm nay là ngày {formatted_date}",
        #     metadata={"source": "time"}
        # )
        # final_documents = [time_document]
        # if intent == ChatIntent.DIEM_CHUAN.value:
        #     try:
        #         query_diem_chuan = await self.sql_agent.query(question)
        #         doc = Document(page_content=query_diem_chuan)
        #         print(f"QUERY DIEM CHUAN: {query_diem_chuan}")
        #         final_documents.append(doc)
        #         retrieve_k = 5
        #     except Exception as e:
        #         print("ERROR: ", e)
        #         retrieve_k = 20
        # else:
        #     retrieve_k = 20
        # # print("CURRENT: ", final_documents)
        # documents = self.retriever.retrieve(question, k=retrieve_k)
        # final_documents.extend(documents)
        # # print("FINAL DOCUMENTS: ", final_documents)
        # print("LEN DOCUMENTS: ", len(final_documents))
        # context = format_docs(final_documents)
        return {**state, "context": "OK"}


    async def generate_response(self, state: AgentState) -> AgentState:
        # Skip generation if there's a cache hit (should never reach here on cache hit)
        if state.get("cache_hit", False):
            print("Warning: generate_response called with cache_hit=True")
            return state
            
        context = state.get("context", "")
        if not context:
            context = ""
        summary = state.get("summary", "")
        if not summary:
            summary = ""
        system_message = SystemMessage(content=GENERATE_RESPONSE_PROMPT_ADMISSION_CHATBOT.format(
            context=context
        ))
        if summary:
            system_message = SystemMessage(content=GENERATE_RESCOPONSE_CONTINUE_PROMPT_ADMISSION_CHATBOT.format(
                summary=summary,
                context=context
            ))
            
        response = await self.llm.ainvoke([system_message] + state.get("messages", []))
        return {**state, "response": response.content }


    async def summarize_conversation(self, state: AgentState) -> AgentState:
        summary = state.get("summary", "")
        if summary:
            summary_message = (
                f"Đây là tóm tắt cuộc trò chuyện cho đến nay: {summary}\n\n"
                "Kết hợp với câu hỏi mới nhất để tạo tóm tắt mới"
                "Đảm bảo tóm tắt mới được tạo ra phải đảm bảo được tính chính xác và đầy đủ, tập trung vào nội dung chính của cuộc trò chuyện, không cần giải thích hoặc bổ sung thêm thông tin không liên quan."
            )
        else:
            summary_message = "Tạo một tóm tắt cuộc trò chuyện phía trên:"
        messages = state.get("messages", []) + [HumanMessage(content=summary_message)]
        response = await self.summarizer_llm.ainvoke(messages)
        delete_messages = [RemoveMessage(id=m.id) for m in state.get("messages", [])[:-2]]
        return {"summary": response.content, "messages": delete_messages}
        
    def should_continue(self, state: AgentState) -> Literal["summarize_conversation", END]:
        messages = state.get("messages", [])
        if len(messages) > 6:
            return "summarize_conversation"
        return END
     
    async def update_chat_history(self, state: AgentState) -> AgentState:
        question = state.get("question", "")
        response = state.get("response", "")
        messages = state.get("messages", [])
        messages.append(AIMessage(content=response))
        thread_id = state.get("thread_id", "")  
        print("thread_id", thread_id)
        pg_history = self.chat_memory.get_session_history(thread_id)
        pg_history.add_user_message(question)
        pg_history.add_ai_message(response)
        # if not state.get("cache_hit", False) and state.get("rewritten_question") and response:
        #     await self.semantic_cache.add_to_cache_async(state["rewritten_question"], response)
        return state

    async def execute_workflow(self, question: str, thread_id: str):
        input_message = HumanMessage(content=question) 
        state = {
            "question": question,
            "thread_id": thread_id,
            "response": None,
            "messages": [input_message],
            "cache_hit": None
        }

        config = {"configurable": {"thread_id": thread_id}}
        
        async for msg, metadata in self.graph.astream(
            state,
            stream_mode="messages",
            config=config,
        ):
            if msg.content and metadata["langgraph_node"] in ["generate_response", "check_cache"]:
                yield msg.content
            
            
    def start_new_session(self):
        return str(uuid.uuid4())

    def get_chat_history(self, thread_id: str) -> List[MessageSchema]:
        history_session = self.chat_memory.get_session_history(thread_id)
        messages = history_session.get_messages()
        list_messages: List[MessageSchema] = []
        for message in messages:
            role = "local" if message.type == "human" else "ai"
            list_messages.append(MessageSchema(role=role, content=message.content))
        return list_messages