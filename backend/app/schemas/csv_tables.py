from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ColumnType(str, Enum):
    """Supported column data types"""
    BIGINT = "BIGINT"
    TEXT = "TEXT"
    DECIMAL = "DECIMAL"


class CSVTableColumnsInput(BaseModel):
    """Column schema for input (create/update) - type must be specified by user"""
    name: str
    type: ColumnType
    description: str
    is_categorical: bool


class CSVTableColumnsResponse(BaseModel):
    """Column schema for output - includes auto-generated fields"""
    name: str
    type: ColumnType
    description: str
    is_categorical: bool
    unique_values: Optional[str] = None


class CSVTableCreate(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    columns: List[CSVTableColumnsInput]


class CSVTableUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    columns: Optional[List[CSVTableColumnsInput]] = None


class CSVTableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    url: str
    description: Optional[str]
    columns: List[CSVTableColumnsResponse]
    created_at: datetime
    updated_at: datetime


# Legacy schemas for backward compatibility
class CSVTableColumns(BaseModel):
    name: str
    type: ColumnType
    description: str
    is_categorical: bool
    unique_values: Optional[str] = None


class CSVTables(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    columns: List[CSVTableColumns]