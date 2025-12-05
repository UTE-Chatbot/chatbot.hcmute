# import pandas as pd
# import duckdb
# import re
# import asyncio


# class DataframeDB:
#     def __init__(self, table_name: str = "diem_chuan", file_name: str = "./dataset/diem_chuan.csv"):
#         self.table_name = table_name
#         self.file_name = file_name
#         self.dataframe = pd.read_csv(file_name)
#         self.conn = duckdb.connect()
        
#         self.load_data()
        
#     def load_data(self):
#         """
#         READ FILE FROM CSV AND LOAD to self.conn
#         """
#         # Tạo bảng từ file CSV
#         query = f"""
#         CREATE TABLE {self.table_name} AS 
#         SELECT * FROM read_csv_auto('{self.file_name}', header=True);
#         """    
        
#         self.conn.execute(query=query)
        
#     async def execute_sql(self, sql_query: str):
#         """
#         Execute SQL query asynchronously after validation.
#         """
#         if not self.validate_sql(sql_query):
#             raise ValueError("Invalid SQL query")
#         result = await asyncio.to_thread(self._sync_execute_sql, sql_query)
#         return result

#     def _sync_execute_sql(self, sql_query: str):
#         # Truy vấn trực tiếp từ file CSV in thread
#         df = self.conn.execute(sql_query).fetch_df()
#         result_dict = df.to_dict(orient='records')
#         print(f"result of <execute_sql>: {result_dict}")
#         return result_dict

#     def validate_sql(self, sql_query: str) -> bool:
#         """
#         Validate that the SQL query is safe:
#         - Only allows SELECT queries
#         - Disallows dangerous SQL operations or system access
#         - Prevents SQL injection techniques
#         """
#         sql_upper = sql_query.upper()

#         # Không bắt đầu bằng SELECT
#         if not sql_upper.strip().startswith("SELECT"):
#             return False

#         # Từ khóa nguy hiểm (DML, DDL, injection)
#         dangerous_keywords = [
#             'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER', 'CREATE', 
#             '--', ';', '/*', '*/', '@@', '@', 'CHAR(', 'NCHAR(', 'VARCHAR(', 'NVARCHAR(',
#             'INFORMATION_SCHEMA', 'PG_', 'SQLITE_', 'SYS.'
#         ]
#         if any(keyword in sql_upper for keyword in dangerous_keywords):
#             return False

#         # Loại bỏ các chuỗi nhiều truy vấn (SELECT ...; SELECT ...)
#         if sql_upper.count("SELECT") > 1:
#             return False

#         # Không có dấu chấm phẩy ở giữa (chỉ cho phép 1 câu truy vấn)
#         if ";" in sql_upper.strip()[:-1]:
#             return False

#         # Không chứa comment hoặc biểu thức logic injection
#         if re.search(r"(--|/\*|\*/|\bor\b|\band\b).*=", sql_upper):
#             return False

#         return True
    
#     def get_unique_values(self, data, column_name):
#         unique_list = data[column_name].unique().tolist()
#         return unique_list

#     def getTableDescription(self, sample_rows: int = 3) -> str:
        
#         # Lấy schema
#         schema_df = self.conn.execute(f"DESCRIBE {self.table_name}").fetch_df()

#         # Lấy vài dòng dữ liệu ví dụ
#         sample_df = self.conn.execute(f"SELECT * FROM {self.table_name} LIMIT {sample_rows}").fetch_df()
        
#         # Format schema
#         schema_lines = [f"Bảng: {self.table_name}", "Gồm các cột:"]
#         for _, row in schema_df.iterrows():
#             col_name = row["column_name"]
#             col_type = row["column_type"]
#             schema_lines.append(f"- {col_name}: {col_type}")
        
#         # Format sample rows - dạng văn bản tường minh
#         sample_lines = ["\nVí dụ:"]
#         for _, row in sample_df.iterrows():
#             formatted = ", ".join([f"{col}: {row[col]}" for col in sample_df.columns])
#             sample_lines.append(formatted)
    
#         # Gộp lại mô tả
#         return "\n".join(schema_lines + sample_lines)
    
#     def get_full_description(self):
#         unique_khoa = self.get_unique_values(self.dataframe, "khoa")
#         unique_nam = self.get_unique_values(self.dataframe, "nam")
        
        
#         khoa_nganh_description = ""
#         for khoa in unique_khoa:
#             unique_nganh = self.get_unique_values(self.dataframe[self.dataframe["khoa"] == khoa], "ten_nganh")  
#             khoa_nganh_description += f"- Khoa {khoa} có các ngành như: {', '.join(unique_nganh)}\n"
            
#         tradditional_info = (
#             f"Dữ liệu bao gồm:\n"
#             f"{khoa_nganh_description}\n"
#             f"Và điểm chuẩn qua các năm như: {unique_nam}"
#         )

#         schema = self.getTableDescription()

#         full_description = (
#             f"{tradditional_info}\n"
#             f"Lược đồ của bảng\n {schema}"
#         )
        
#         return full_description
