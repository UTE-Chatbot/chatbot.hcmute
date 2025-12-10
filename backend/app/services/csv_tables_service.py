import os
import asyncio
import duckdb
import pandas as pd
from typing import List, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.csv_table import CSVTable
from app.schemas.csv_tables import CSVTableCreate, CSVTableUpdate
from app.services.minio_service import get_file_stream
from app.utils.sql import validate_sql

DB_PATH = os.path.join(os.path.dirname(__file__), '../assets/csv_tables.db')

# Cached schema strings - updated whenever tables change
_cached_tables_schema: str = ""
_cached_tables_schema_simple: str = ""


def get_cached_tables_schema() -> str:
    """Get the cached full schema string (with types and unique values)."""
    return _cached_tables_schema


def get_cached_tables_schema_simple() -> str:
    """Get the cached simple schema string (just table/column names and descriptions)."""
    return _cached_tables_schema_simple


def get_db_connection():
    return duckdb.connect(DB_PATH)
def execute_sql_query(sql_query: str) -> Union[List[dict], dict]:
    conn = get_db_connection()
    try:
        df = conn.execute(sql_query).fetch_df()
        result_dict = df.to_dict(orient='records')
        return result_dict
    except Exception as e:
        return None 
    finally:
        conn.close()


async def get_all_csv_tables(db: AsyncSession) -> List[CSVTable]:
    result = await db.execute(select(CSVTable).order_by(CSVTable.id))
    return result.scalars().all()


async def get_csv_table_by_id(db: AsyncSession, table_id: int) -> Optional[CSVTable]:
    result = await db.execute(select(CSVTable).where(CSVTable.id == table_id))
    return result.scalar_one_or_none()


async def get_csv_table_by_name(db: AsyncSession, name: str) -> Optional[CSVTable]:
    result = await db.execute(select(CSVTable).where(CSVTable.name == name))
    return result.scalar_one_or_none()


async def get_all_tables_with_db_schema(use_cache: bool = True) -> str:
    """
    Lấy tất cả bảng CSV kết hợp với thông tin schema từ DuckDB.
    Trả về mô tả dạng văn bản có cấu trúc của tất cả các bảng và cột.
    
    Args:
        use_cache: If True, returns cached schema. If False, rebuilds from DB.
    """
    global _cached_tables_schema
    
    if use_cache and _cached_tables_schema:
        return _cached_tables_schema
    
    # Refresh cache and return
    await refresh_cached_schemas()
    return _cached_tables_schema


async def get_all_tables_simple_schema(use_cache: bool = True) -> str:
    """
    Lấy tất cả bảng CSV với chỉ tên bảng, tên cột và mô tả.
    Phiên bản đơn giản hơn, không bao gồm kiểu dữ liệu và giá trị unique.
    
    Args:
        use_cache: If True, returns cached schema. If False, rebuilds from DB.
    """
    global _cached_tables_schema_simple
    
    if use_cache and _cached_tables_schema_simple:
        return _cached_tables_schema_simple
    
    # Refresh cache and return
    await refresh_cached_schemas()
    return _cached_tables_schema_simple


def _build_simple_schema(csv_tables: List[CSVTable]) -> str:
    """Build simple schema string with just table/column names and descriptions."""
    if not csv_tables:
        return "Không có bảng nào."
    
    output_lines = []
    for csv_table in csv_tables:
        clean_table_name = csv_table.name.replace(" ", "_").replace("-", "_")
        
        output_lines.append(f'## Bảng: "{clean_table_name}"')
        if csv_table.description:
            output_lines.append(f"Mô tả: {csv_table.description}")
        output_lines.append("")
        output_lines.append("Các cột:")
        
        for col in csv_table.columns:
            col_name = col.get("name")
            col_desc = col.get("description", "")
            col_line = f'  - "{col_name}"'
            if col_desc:
                col_line += f": {col_desc}"
            output_lines.append(col_line)
        
        output_lines.append("")
        output_lines.append("---")
        output_lines.append("")
    
    return "\n".join(output_lines)


def _build_full_schema(csv_tables: List[CSVTable], db_schemas: dict) -> str:
    """Build full schema string with types and unique values."""
    if not csv_tables:
        return "Không có bảng nào."
    
    output_lines = []
    for csv_table in csv_tables:
        clean_table_name = csv_table.name.replace(" ", "_").replace("-", "_")
        db_columns_info = db_schemas.get(clean_table_name, {})
        
        output_lines.append(f'## Bảng: "{clean_table_name}"')
        if csv_table.description:
            output_lines.append(f"Mô tả: {csv_table.description}")
        output_lines.append("")
        output_lines.append("Các cột:")
        
        for col in csv_table.columns:
            col_name = col.get("name")
            col_desc = col.get("description", "")
            col_type = db_columns_info.get(col_name, col.get("type", "UNKNOWN"))
            is_categorical = col.get("is_categorical", False)
            unique_values = col.get("unique_values", "")
           
            col_line = f'  - "{col_name}" ({col_type})'
            if col_desc:
                col_line += f": {col_desc}"
            output_lines.append(col_line)
         
            if is_categorical and unique_values:
                output_lines.append(f"    Các giá trị có thể: {unique_values}")
        
        output_lines.append("")
        output_lines.append("---")
        output_lines.append("")
    
    return "\n".join(output_lines)


async def refresh_cached_schemas():
    """Refresh both cached schema strings. Call this after any table changes."""
    global _cached_tables_schema, _cached_tables_schema_simple
    
    from app.db.session import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(CSVTable).order_by(CSVTable.id))
        csv_tables = result.scalars().all()
        
        if not csv_tables:
            _cached_tables_schema = "Không có bảng nào."
            _cached_tables_schema_simple = "Không có bảng nào."
            return
        
        # Build simple schema
        _cached_tables_schema_simple = _build_simple_schema(csv_tables)
        
        # Build full schema with DuckDB types
        db_schemas = {}
        try:
            conn = get_db_connection()
            try:
                tables_result = conn.execute("SHOW TABLES").fetchall()
                for table_row in tables_result:
                    table_name = table_row[0]
                    schema_result = conn.execute(f"DESCRIBE {table_name}").fetchall()
                    db_schemas[table_name] = {row[0]: row[1] for row in schema_result}
            finally:
                conn.close()
        except Exception:
            pass
        
        _cached_tables_schema = _build_full_schema(csv_tables, db_schemas)


def load_csv_dataframe(csv_url: str, **kwargs) -> pd.DataFrame:
    if "/api/v1/files/" in csv_url:
        stream = get_file_stream(csv_url)
        if stream:
            return pd.read_csv(stream, **kwargs)
    if csv_url.startswith("http://") or csv_url.startswith("https://"):
        return pd.read_csv(csv_url, **kwargs)
    else:
        csv_path = os.path.join(os.path.dirname(__file__), '../assets/csv', csv_url)
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        return pd.read_csv(csv_path, **kwargs)


def extract_unique_values(csv_url: str, column_name: str, max_values: int = 100) -> str:
    try:
        df = load_csv_dataframe(csv_url)
        if column_name not in df.columns:
            return f""
        unique_vals = df[column_name].dropna().unique()
        if len(unique_vals) > max_values:
            unique_vals = unique_vals[:max_values]
            return ", ".join(map(str, unique_vals)) + f" ... ({len(df[column_name].unique())} total unique values)"
        return ", ".join(map(str, unique_vals))
    except Exception as e:
        return f"Error extracting unique values: {str(e)}"
async def create_csv_table(db: AsyncSession, table_data: CSVTableCreate) -> CSVTable:
    columns_list = []
    for column in table_data.columns:
        col_dict = column.model_dump()
        if col_dict.get("is_categorical", False):
            unique_vals = await asyncio.to_thread(extract_unique_values, table_data.url, column.name)
            col_dict["unique_values"] = unique_vals
        col_dict["type"] = column.type.value
        columns_list.append(col_dict)

    csv_table = CSVTable(
        name=table_data.name,
        url=table_data.url,
        description=table_data.description,
        columns=columns_list
    )
    
    db.add(csv_table)
    await db.commit()
    await db.refresh(csv_table)
    await rebuild_database()
    return csv_table


async def update_csv_table(db: AsyncSession, table_id: int, table_data: CSVTableUpdate) -> Optional[CSVTable]:
    csv_table = await get_csv_table_by_id(db, table_id)
    
    if not csv_table:
        return None
    
    if table_data.name is not None:
        csv_table.name = table_data.name
    
    if table_data.url is not None:
        csv_table.url = table_data.url
    
    if table_data.description is not None:
        csv_table.description = table_data.description
    
    if table_data.columns is not None:
        columns_list = []
        csv_url = table_data.url if table_data.url else csv_table.url
        
        for column in table_data.columns:
            col_dict = column.model_dump()
            if col_dict.get("is_categorical", False):
                unique_vals = await asyncio.to_thread(extract_unique_values, csv_url, column.name)
                col_dict["unique_values"] = unique_vals
            col_dict["type"] = column.type.value
            columns_list.append(col_dict)
        
        csv_table.columns = columns_list
    
    await db.commit()
    await db.refresh(csv_table)
    
    await rebuild_database()
    
    return csv_table


async def delete_csv_table(db: AsyncSession, table_id: int) -> bool:
    csv_table = await get_csv_table_by_id(db, table_id)
    
    if not csv_table:
        return False
    
    await db.delete(csv_table)
    await db.commit()
    
    await rebuild_database()
    
    return True


async def rebuild_database():
    conn = get_db_connection()
    try:
        try:
            result = conn.execute("SHOW TABLES").fetchall()
            existing_tables = [row[0] for row in result]
            for table in existing_tables:
                conn.execute(f"DROP TABLE IF EXISTS {table}")
        except Exception:
            pass
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            tables = await get_all_csv_tables(session)
            
            for csv_table in tables:
                table_name = csv_table.name
                csv_url = csv_table.url
                
                if not table_name or not csv_url:
                    continue
                
                try:
                    df = await asyncio.to_thread(load_csv_dataframe, csv_url)
                    clean_table_name = table_name.replace(" ", "_").replace("-", "_")
                    conn.execute(f"CREATE TABLE {clean_table_name} AS SELECT * FROM df")
                except Exception as e:
                    print(f"Error loading table {table_name}: {str(e)}")
                    continue
        if os.path.exists(DB_PATH):
            os.utime(DB_PATH, None)
    finally:
        conn.close()
    
    # Refresh cached schemas after rebuilding database
    await refresh_cached_schemas()
