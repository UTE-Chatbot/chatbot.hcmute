import re

def validate_sql(sql_query: str) -> bool:
    """
    Validate that the SQL query is safe:
    - Only allows SELECT queries
    - Disallows dangerous SQL operations or system access
    - Prevents SQL injection techniques
    """
    sql_upper = sql_query.upper()

    # Must start with SELECT
    if not sql_upper.strip().startswith("SELECT"):
        return False

    # Dangerous keywords (DML, DDL, injection)
    dangerous_keywords = [
        'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER', 'CREATE',
        '--', ';', '/*', '*/', '@@', '@', 'CHAR(', 'NCHAR(', 'VARCHAR(', 'NVARCHAR(',
        'INFORMATION_SCHEMA', 'PG_', 'SQLITE_', 'SYS.'
    ]
    if any(keyword in sql_upper for keyword in dangerous_keywords):
        return False

    # Disallow multiple queries (SELECT ...; SELECT ...)
    if sql_upper.count("SELECT") > 1:
        return False

    # No semicolon in the middle (only allow 1 query)
    if ";" in sql_upper.strip()[:-1]:
        return False

    # No comments or injection logic expressions
    if re.search(r"(--|/\*|\*/|\bor\b|\band\b).*=", sql_upper):
        return False

    return True

def sql_query_extract(text: str) -> str:
    match = re.search(r"```sql\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if match:
        text = match.group(1).strip()

    # Extract SQL from direct format
    match = re.search(r"SQLQuery:\s*(.*)", text, re.DOTALL | re.IGNORECASE)
    if match:
        text = match.group(1).strip()
    
    if text.endswith(";"):
        text = text[:-1] 
        
    return text.strip()
        