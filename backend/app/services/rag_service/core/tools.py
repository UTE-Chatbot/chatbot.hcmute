from langchain.tools import tool

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

