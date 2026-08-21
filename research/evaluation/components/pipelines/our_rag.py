from dataclasses import dataclass
from typing import List, Optional
from collections import defaultdict
import asyncio
import json
from langchain_core.messages import HumanMessage
from langchain_qdrant import QdrantVectorStore
from langchain_openai import ChatOpenAI
from components.prompt import RAG_GENERATE_PROMPT, TOOL_SELECTION_PROMPT, QUERY_EXPANSION_PROMPT
from components.reranks import JinaReranker
from config import settings
import duckdb
import pandas as pd
from pathlib import Path

@dataclass
class PipelineResult:
    question: str
    context: List[str]
    doc_ids: List[str]
    answer: str
    tool_used: str = "none"

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / "dataset"
DB_PATH = str(ASSETS_DIR / "csv_tables.db")

def get_db_connection():
    return duckdb.connect(DB_PATH)

def load_table_schema() -> str:
    schema_path = ASSETS_DIR / "csv_table_schemas.csv"
    if not schema_path.exists():
        return ""
    df = pd.read_csv(schema_path)
    lines = []
    for _, row in df.iterrows():
        lines.append(f"Table: {row['name']}\nDescription: {row['description']}\nColumns: {row['columns']}")
    return "\n\n".join(lines)

def execute_sql_query(sql_query: str) -> str:
    conn = get_db_connection()
    try:
        df = conn.execute(sql_query).fetch_df()
        return df.to_string()
    except Exception as e:
        return f"SQL Error: {str(e)}"
    finally:
        conn.close()


class OurRAGPipeline:
    def __init__(
        self,
        vector_store: QdrantVectorStore,
        k: int = 10,
        model_name: str = "gpt-5-mini",
        temperature: float = 0.0,
        reranker: Optional[JinaReranker] = None,
        rerank_top_k: int = 5,
        use_query_expansion: bool = True,
        use_tool_routing: bool = True,
        disable_text2sql: bool = False,
        seed: int = None,
    ):
        self.vector_store = vector_store
        self.k = k
        self.llm = ChatOpenAI(model=model_name, temperature=temperature, api_key=settings.api_key, seed=seed)
        self.tool_llm = ChatOpenAI(model=model_name, temperature=0, api_key=settings.api_key, seed=seed)
        self.schema = load_table_schema()
        self.reranker = reranker
        self.rerank_top_k = rerank_top_k
        self.use_query_expansion = use_query_expansion
        self.use_tool_routing = use_tool_routing
        self.disable_text2sql = disable_text2sql

    async def _expand_query(self, question: str) -> List[str]:
        if not self.use_query_expansion:
            return [question]
        prompt = QUERY_EXPANSION_PROMPT.format(question=question)
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        try:
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            result = json.loads(content.strip())
            queries = result.get("queries", [])
            return [question] + queries[:3]
        except:
            return [question]

    async def _retrieve_for_query(self, query: str) -> List[tuple]:
        docs = await asyncio.to_thread(
            self.vector_store.similarity_search, query, k=self.k
        )
        return [(doc.page_content, doc.metadata) for doc in docs]

    def _reciprocal_rank_fusion(self, doc_lists: List[List[tuple]], k: int = 60) -> List[tuple]:
        scores = defaultdict(float)
        doc_map = {}
        for docs in doc_lists:
            for rank, (content, metadata) in enumerate(docs):
                key = content[:200]
                scores[key] += 1 / (rank + k)
                doc_map[key] = (content, metadata)

        sorted_keys = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        return [doc_map[key] for key in sorted_keys]

    async def _document_search(self, query: str) -> tuple[List[str], List[str]]:
        expanded_queries = await self._expand_query(query)

        all_results = []
        for q in expanded_queries:
            docs = await self._retrieve_for_query(q)
            all_results.append(docs)

        fused_docs = self._reciprocal_rank_fusion(all_results)

        if self.reranker and fused_docs:
            contents = [doc[0] for doc in fused_docs[:self.k * 2]]
            reranked = self.reranker.rerank(query, contents, top_k=self.rerank_top_k)
            final_docs = [(reranked[i].content, fused_docs[reranked[i].original_index][1]) for i in range(len(reranked))]
        else:
            final_docs = fused_docs[:self.k]

        context = [doc[0] for doc in final_docs]
        doc_ids = [doc[1].get("document_id", str(i)) for i, doc in enumerate(final_docs)]

        return context, doc_ids

    async def _text2sql(self, query: str) -> str:
        from langchain_core.prompts import ChatPromptTemplate
        prompt = ChatPromptTemplate.from_template("""
Bạn là trợ lý chuyên chuyển đổi câu hỏi tiếng Việt thành SQL cho hệ thống Tuyển sinh HCMUTE.

# SCHEMA CƠ SỞ DỮ LIỆU
{schema}

# QUY TẮC
1. CHỈ sử dụng tên bảng và cột có trong schema
2. KHÔNG tạo cột giả (NULL AS "tên cột")
3. Luôn dùng dấu ngoặc kép "" cho tên bảng và cột
4. Sử dụng ILIKE '%từ khóa%' cho tìm kiếm chuỗi
5. Nếu không thể tạo SQL chính xác → trả về chuỗi rỗng

# CÂU HỎI
{query}

# TRUY VẤN SQL
Chỉ trả về câu SQL, không giải thích.
""")
        messages = prompt.format_messages(schema=self.schema, query=query)
        response = await self.llm.ainvoke(messages)
        sql = response.content.strip()
        if sql.startswith("```"):
            sql = sql.split("```")[1].replace("sql", "").strip()
        return execute_sql_query(sql)

    async def _select_and_execute_tools(self, question: str) -> tuple[List[str], List[str], List[str]]:
        # Ablation: skip tool routing → always document_search
        if not self.use_tool_routing:
            ctx, ids = await self._document_search(question)
            return ctx, ids, ["document_search"]

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "document_search_tool",
                    "description": "Tìm kiếm thông tin mô tả, hướng dẫn từ kho tài liệu HCMUTE. Sử dụng cho câu hỏi về: giới thiệu ngành học, chương trình đào tạo, quy chế tuyển sinh, thủ tục đăng ký, cơ sở vật chất, đời sống sinh viên, hướng dẫn và thông báo.",
                    "parameters": {
                        "type": "object",
                        "properties": {"query": {"type": "string", "description": "Câu truy vấn tìm kiếm tài liệu"}},
                        "required": ["query"]
                    }
                }
            },
        ]

        # Ablation: only add text2sql tool if not disabled
        if not self.disable_text2sql:
            tools.append({
                "type": "function",
                "function": {
                    "name": "text2sql_tool",
                    "description": "Truy vấn số liệu cụ thể từ cơ sở dữ liệu HCMUTE. Sử dụng cho câu hỏi về: điểm chuẩn, chỉ tiêu tuyển sinh, học phí, mã ngành, tỷ lệ chọi, và các thông tin định lượng khác.",
                    "parameters": {
                        "type": "object",
                        "properties": {"query_text": {"type": "string", "description": "Câu hỏi cần chuyển thành SQL"}},
                        "required": ["query_text"]
                    }
                }
            })

        prompt = TOOL_SELECTION_PROMPT.format(schema=self.schema, question=question)
        response = await self.tool_llm.bind(tools=tools).ainvoke([HumanMessage(content=prompt)])

        all_context = []
        all_doc_ids = []
        tools_used = []

        if hasattr(response, 'tool_calls') and response.tool_calls:
            for tool_call in response.tool_calls:
                name = tool_call["name"]
                args = tool_call["args"]
                if name == "document_search_tool":
                    ctx, ids = await self._document_search(args.get("query", question))
                    all_context.extend(ctx)
                    all_doc_ids.extend(ids)
                    tools_used.append("document_search")
                elif name == "text2sql_tool":
                    result = await self._text2sql(args.get("query_text", question))
                    all_context.append(result)
                    tools_used.append("text2sql")
        else:
            ctx, ids = await self._document_search(question)
            all_context.extend(ctx)
            all_doc_ids.extend(ids)
            tools_used.append("document_search")

        return all_context, all_doc_ids, tools_used

    async def _generate_response(self, question: str, context: List[str]) -> str:
        context_str = "\n\n".join(context)
        prompt = RAG_GENERATE_PROMPT.format(context=context_str, question=question)
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return response.content

    async def run(self, question: str) -> PipelineResult:
        context, doc_ids, tools_used = await self._select_and_execute_tools(question)
        answer = await self._generate_response(question, context)
        return PipelineResult(
            question=question,
            context=context,
            doc_ids=doc_ids,
            answer=answer,
            tool_used=",".join(tools_used) if tools_used else "none",
        )
