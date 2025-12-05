import os
from uuid import uuid4

from app.core.config import settings
from app.services.rag_service.core.types import MessageSchema
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_postgres import PostgresChatMessageHistory
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, BaseMessage
from typing import Dict, List, Tuple, Any, TypedDict, Annotated, Optional
from psycopg import connect

class ChatHistory:
    def __init__(self):
        print(f"Connecting to PostgreSQL database at {settings.postgres_db}:{settings.postgres_host}...")
        self.conn_info = f"dbname={settings.postgres_db} user={settings.postgres_user} password={settings.postgres_password} host={settings.postgres_host} port={settings.postgres_port}"
        sync_connection = connect(self.conn_info)
        table_name = settings.chat_history_table_name
        self.table_name = table_name or f"chat_history_{self.session_id}"
        if not self.table_exists():
            PostgresChatMessageHistory.create_tables(sync_connection, self.table_name)
            print(f"Table {self.table_name} created successfully ✅.")
            
    def table_exists(self):
        with connect(self.conn_info) as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='{self.table_name}')")
                return cursor.fetchone()[0]

    def get_session_history(self, session_id: str) -> PostgresChatMessageHistory:
        if self.table_exists():
            sync_connection = connect(self.conn_info)
            return PostgresChatMessageHistory(
                self.table_name,
                session_id,
                sync_connection=sync_connection
            )
        else:
            return None

    def get_messages_from_session(self, session_id: str) -> List[BaseMessage]:
        pg_history = self.get_session_history(session_id)

        chat_history = []
        for message in pg_history.messages:
            if message.type == "human":
                chat_history.append(HumanMessage(content=message.content))
            elif message.type == "ai":
                chat_history.append(AIMessage(content=message.content))

        return chat_history

    def start_new_session(self):
        return str(uuid4())

    def get_chat_history(self, thread_id: str) -> List[MessageSchema]:
        history_session = self.chat_memory.get_session_history(thread_id)
        messages = history_session.get_messages()
        list_messages: List[MessageSchema] = []
        for message in messages:
            role = "local" if message.type == "human" else "ai"
            list_messages.append(MessageSchema(role=role, content=message.content))
        return list_messages