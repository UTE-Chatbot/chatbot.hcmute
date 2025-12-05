from app.services.csv_tables_service import execute_sql_query
from app.services.rag_service.component.prompt import TEXT2SQL_PROMPT_TEMPLATE
from app.services.rag_service.component.llms import get_cost_effective_chat_model
from app.services.csv_tables_service import get_all_tables_with_db_schema
from app.utils.sql import sql_query_extract, validate_sql
class Text2SQL:
    def __init__(self):
        self.llm = get_cost_effective_chat_model()
        pass 
    
    
    async def execute(self, query_text: str) -> str:
        tables_with_db_schema = await get_all_tables_with_db_schema()
        prompt = TEXT2SQL_PROMPT_TEMPLATE.format(
            schema=tables_with_db_schema,
            query_text=query_text
        )

        response = await self.llm.ainvoke(prompt)
        query = response.content.strip()
        query = sql_query_extract(query)
        if not validate_sql(query):
            return ""
    
        sql_result = execute_sql_query(query)
        if not isinstance(sql_result, str):
            if isinstance(sql_result, (list, tuple)):
                sql_result = ", ".join(str(x) for x in sql_result)
            else:
                sql_result = str(sql_result)
        
        return sql_result
    
from langchain.tools import tool
text2sql_instance = Text2SQL()

@tool 
async def text2sql_tool(query_text: str) -> str:
    """
    Convert natural language text to SQL and execute it on the CSV database.
    Return the SQL query result as a string.
    Args:
        query_text (str): The natural language query text.
    Returns:
        str: The result of the executed SQL query.
    """
    result = await text2sql_instance.execute(query_text)
    return result