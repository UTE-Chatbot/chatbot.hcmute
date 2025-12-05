from sqlalchemy import Column, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base, BaseModel


class CSVTable(Base, BaseModel):
    __tablename__ = "csv_tables"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True, index=True)
    url = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    columns = Column(JSONB, nullable=False, default=list)
