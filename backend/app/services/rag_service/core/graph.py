from typing import Literal, Any
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.messages.utils import count_tokens_approximately
from langgraph.graph import StateGraph, START, END
from langmem.short_term import SummarizationNode
from app.services.csv_tables_service import get_cached_tables_schema_simple

from app.services.rag_service.component.chat_history import ChatHistory
from app.services.rag_service.component.cache import SemanticCache
from app.services.rag_service.component.embeddings import get_dense_embedding_model
from app.services.rag_service.component.prompt import (
    RETRIEVE_INFORMATION_WITH_TOOLS_PROMPT,
    GENERATE_RESPONSE_PROMPT_ADMISSION_CHATBOT,
    SUMMARIZE_VIETNAMESE_INITIAL_PROMPT,
    SUMMARIZE_VIETNAMESE_EXISTING_PROMPT,
    SUMMARIZE_VIETNAMESE_FINAL_PROMPT,
)
from app.services.rag_service.component.llms import get_cost_effective_chat_model, get_high_performance_chat_model
from app.db.checkpointer import get_checkpointer
from app.services.rag_service.core.types import AgentState
from app.services.rag_service.component.tools import tools, tools_by_name

class RAG:
    def __init__(self):
        self.chat_memory = ChatHistory()
        self.rewrite_llm = get_cost_effective_chat_model()
        self.llm = get_high_performance_chat_model()
        self.graph = None
        self.summarizer_llm = get_cost_effective_chat_model().bind(max_tokens=128)
        self.agent_executor = get_cost_effective_chat_model().bind_tools(tools).bind(max_tokens=1024, temperature=0)
        
        embeddings = get_dense_embedding_model()
        embeddings_size = 1536
        self.semantic_cache = SemanticCache(embeddings, embeddings_size)

        self.summarization_node = SummarizationNode(
            token_counter=count_tokens_approximately,
            model=self.summarizer_llm,
            max_tokens=256,
            max_tokens_before_summary=256,
            max_summary_tokens=128,
            initial_summary_prompt=SUMMARIZE_VIETNAMESE_INITIAL_PROMPT,
            existing_summary_prompt=SUMMARIZE_VIETNAMESE_EXISTING_PROMPT,
            final_prompt=SUMMARIZE_VIETNAMESE_FINAL_PROMPT,
            input_messages_key="messages",
            output_messages_key="messages"
        )

    @classmethod
    async def create(cls):
        self = cls()
        await self.init_workflow()
        return self

    async def tool_executor(self, state: AgentState):
        question = state.get("question", "")
        running_summary = state.get("context", {}).get("running_summary")
        
        context_summary = ""
        if running_summary:
            if hasattr(running_summary, "summary"):
                context_summary = running_summary.summary
            elif isinstance(running_summary, dict):
                context_summary = running_summary.get("summary", "")
        
        summary = context_summary if context_summary else state.get("summary", "")
        information = state.get("information", []) or []
        
        tool_selection_prompt = RETRIEVE_INFORMATION_WITH_TOOLS_PROMPT.format(
            question=question,
            summary=summary,
            schema=get_cached_tables_schema_simple()
        )

        messages = [
            SystemMessage(content=tool_selection_prompt),
            HumanMessage(content=question)
        ]

        result = await self.agent_executor.ainvoke(messages)
        
        if hasattr(result, 'tool_calls') and result.tool_calls:
            for tool_call in result.tool_calls:
                tool_name = tool_call["name"]
                if tool_name in tools_by_name:
                    tool = tools_by_name[tool_name]
                    observation = await tool.ainvoke(tool_call["args"])
                else:
                    observation = f"Tool '{tool_name}' not found."
                information.append(str(observation))

        return {**state, "information": information}

    async def check_cache(self, state: AgentState) -> AgentState:
        question = state.get("question", "")
        cached_response = await self.semantic_cache.search_cache_async(question)
        
        if cached_response:
            return {
                "response": cached_response, 
                "cache_hit": True, 
                "messages": [SystemMessage(content=cached_response)] 
            }
            
        return {"cache_hit": False}

    async def generate_response(self, state: AgentState) -> AgentState:
        information = state.get("information", [])
        context = "\n\n".join(information) if information else ""
        
        running_summary = state.get("context", {}).get("running_summary")
        context_summary = ""
        if running_summary:
            if hasattr(running_summary, "summary"):
                context_summary = running_summary.summary
            elif isinstance(running_summary, dict):
                context_summary = running_summary.get("summary", "")
        summary = context_summary if context_summary else state.get("summary", "")
        
        system_message = SystemMessage(content=GENERATE_RESPONSE_PROMPT_ADMISSION_CHATBOT.format(
            context=context
        ))


        try:
            response_message = await self.llm.ainvoke([system_message] + state.get("messages", []))
        except asyncio.CancelledError:
            # Optionally log or handle cleanup here
            print("Response generation was cancelled.")
            raise
        except Exception as e:
            # Handle other errors gracefully
            print(f"Error during response generation: {e}")
            return {**state, "response": "Sorry, an error occurred.", "messages": []}

        return {"response": response_message.content, "messages": [response_message]}

    def route_cache(self, state: AgentState):
        if state.get("cache_hit", False):
            return "update_chat_history"
        return "rewrite_question"

    async def init_workflow(self):
        workflow = StateGraph(AgentState)

        workflow.add_node("check_cache", self.check_cache)
        workflow.add_node("rewrite_question", self.rewrite_question)
        workflow.add_node("tool_executor", self.tool_executor)
        workflow.add_node("generate_response", self.generate_response)
        workflow.add_node("update_chat_history", self.update_chat_history)
        workflow.add_node("summarize", self.summarization_node)

        workflow.add_edge(START, "check_cache")
        
        workflow.add_conditional_edges(
            "check_cache",
            self.route_cache,
            {
                "update_chat_history": "update_chat_history",
                "rewrite_question": "rewrite_question"
            }
        )

        workflow.add_edge("rewrite_question", "tool_executor")
        workflow.add_edge("tool_executor", "generate_response")
        workflow.add_edge("generate_response", "summarize")
        workflow.add_edge("summarize", "update_chat_history")
        workflow.add_edge("update_chat_history", END)

        checkpointer = await get_checkpointer()
        self.graph = workflow.compile(checkpointer=checkpointer)


    async def rewrite_question(self, state: AgentState) -> AgentState:
        return state

    async def update_chat_history(self, state: AgentState) -> AgentState:
        question = state.get("question", "")
        response = state.get("response", "")
        thread_id = state.get("thread_id", "")
        cache_hit = state.get("cache_hit", False)
        
        pg_history = self.chat_memory.get_session_history(thread_id)
        pg_history.add_user_message(question)
        info = state.get("information", [])
        pg_history.add_message(AIMessage(content=response, additional_kwargs={"information": info}))
        
        if question and response and not cache_hit:
            await self.semantic_cache.add_to_cache_async(question, response)
        
        return state

    async def execute_workflow(self, question: str, thread_id: str):
        config = {"configurable": {"thread_id": thread_id}}
        input_message = HumanMessage(content=question)

        inputs = {
            "question": question,
            "thread_id": thread_id,
            "messages": [input_message],
            "cache_hit": False,
            "information": [],
        }

        try:
            # Use astream_events to catch streaming tokens from LLM and node outputs
            async for event in self.graph.astream_events(
                inputs,
                config=config,
                version="v2"
            ):
                event_type = event.get("event")
                metadata = event.get("metadata", {})
                node_name = metadata.get("langgraph_node", "")

                # 1. Capture Streaming tokens from generate_response
                if event_type == "on_chat_model_stream" and node_name == "generate_response":
                    data = event.get("data", {})
                    chunk = data.get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield {"content": chunk.content, "cache_hit": False}
                
                # 2. Capture Cache Hit from check_cache node
                elif event_type == "on_chain_end" and node_name == "check_cache":
                    data = event.get("data", {})
                    output = data.get("output")
                    # Output is the state returned by check_cache
                    if output and isinstance(output, dict) and output.get("cache_hit"):
                        cached_response = output.get("response")
                        if cached_response:
                            yield {"content": cached_response, "cache_hit": True}
                            
        except Exception as e:
            print(f"[ERROR] Workflow execution failed: {e}")
            import traceback
            traceback.print_exc()