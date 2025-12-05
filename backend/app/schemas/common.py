from pydantic import BaseModel, Field
from typing import Optional, List, Generic, TypeVar, Type, Dict, Any
from enum import Enum
import inspect

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=1000, description="Maximum number of records to return")

class SortDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"

class SortParams(BaseModel):
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_direction: SortDirection = Field(SortDirection.ASC, description="Sort direction")

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    has_next: bool
    has_previous: bool
    
    @classmethod
    def create(
        cls, 
        items: List[T], 
        total: int, 
        skip: int, 
        limit: int
    ):
        return cls(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_next=skip + limit < total,
            has_previous=skip > 0
        )

def get_model_fields(model_class: Type) -> List[str]:
    """
    Extract field names from a Pydantic model
    """
    fields = []
    if hasattr(model_class, '__annotations__'):
        for field_name in model_class.__annotations__.keys():
            if not field_name.startswith('_'): 
                fields.append(field_name)
    
    common_fields = ['id', 'created_at', 'updated_at']
    
    all_fields = list(dict.fromkeys(fields + common_fields))
    return all_fields

def create_sort_field_enum(model_class: Type, enum_name: str = None) -> Type[Enum]:
    """
    Dynamically create a sort field enum from a Pydantic model's fields
    """
    if enum_name is None:
        enum_name = f"{model_class.__name__}SortField"
    
    fields = get_model_fields(model_class)
    enum_fields = {field.upper(): field for field in fields}
    
    return Enum(enum_name, enum_fields)

class GenericSortParams(BaseModel):
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_direction: SortDirection = Field(SortDirection.ASC, description="Sort direction")

class GenericQueryParams(BaseModel):
    pagination: PaginationParams = Field(default_factory=PaginationParams)
    sorting: GenericSortParams = Field(default_factory=GenericSortParams)
    
    def validate_sort_field(self, allowed_fields: List[str]) -> bool:
        """
        Validate that the sort field is in the allowed fields list
        """
        if self.sorting.sort_by is None:
            return True
        return self.sorting.sort_by in allowed_fields

class QueryParams(BaseModel):
    pagination: PaginationParams = Field(default_factory=PaginationParams)
    sorting: SortParams = Field(default_factory=SortParams)
