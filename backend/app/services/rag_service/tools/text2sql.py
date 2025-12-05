from config import settings
import time
from dataset.csv_db import DataframeDB
from typing import Annotated
from langchain_openai import ChatOpenAI
import re
from rag.prompt import sql_gen_prompt, answer_prompt

class Text2SQLTool:
    def __init__(self, llm=None):
        self.dataframe_db = DataframeDB()
        self.sql_gen_prompt = sql_gen_prompt
        self.answer_gen_prompt = answer_prompt
        if llm is None:
            self.llm = ChatOpenAI(model="gpt-4.1-mini", api_key=settings.OPENAI_API_KEY)
        else:
            self.llm = llm
    
    async def query(self, query_text: str) -> str:
        """
        Process a natural language query, convert it to SQL, execute it, and return the results
        """
        # Step 1: Generate SQL from natural language query
        chain = sql_gen_prompt | self.llm 
        local_time = time.localtime()
        formatted_date = time.strftime("%Y-%m-%d", local_time)
        time_document=f"Hôm nay là ngày: {formatted_date}",
        result = await chain.ainvoke({
            "question": f"{time_document}. Câu hỏi: {query_text}",
            "schema": self.dataframe_db.get_full_description()
        })
        
        print("RESULT GEN SQL: ", result)
        query = result.content
        print("RESULT GEN SQL: ", query)
        
        # Extract SQL from code blocks
        match = re.search(r"```sql\s*(.*?)```", query, re.DOTALL | re.IGNORECASE)
        if match:
            query = match.group(1).strip()

        # Extract SQL from direct format
        match = re.search(r"SQLQuery:\s*(.*)", query, re.DOTALL | re.IGNORECASE)
        if match:
            query = match.group(1).strip()

        print(f"first query: {query}")
        if query.endswith(";"):
            query = query[:-1]
        
        # Step 2: Execute the SQL query
        print(query)
        if not self.dataframe_db.validate_sql(sql_query=query):
            print("SQL query bị từ chối do có dấu hiệu SQL injection hoặc DML không cho phép.")
            return ""
        
        sql_result = await self.dataframe_db.execute_sql(sql_query=query)
        print(f"sql_query_result: {sql_result}")
        
        # Step 3: Format the result
        if not isinstance(sql_result, str):
            if isinstance(sql_result, (list, tuple)):
                sql_result = ", ".join(str(x) for x in sql_result)
            else:
                sql_result = str(sql_result)
        
        return sql_result
