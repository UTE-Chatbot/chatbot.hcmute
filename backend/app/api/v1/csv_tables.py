from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_querybuilder import QueryBuilder
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi.responses import JSONResponse, Response
from app.services import csv_tables_service
from app.core.deps import require_roles
from app.models.user import User, RoleEnum
from app.models.csv_table import CSVTable
from app.schemas.csv_tables import CSVTableCreate, CSVTableUpdate, CSVTableResponse
from app.db.session import get_db
from typing import List


router = APIRouter(prefix="/csv_tables", tags=["CSV Tables"])


def serialize_csv_table(table: CSVTable) -> dict:
    """Convert SQLAlchemy CSVTable to dict."""
    return CSVTableResponse.model_validate(table).model_dump(mode="json")


@router.get("", response_model=Page[CSVTableResponse])
async def get_csv_tables(
    query=QueryBuilder(CSVTable),
    params: Params = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    result = await paginate(db, query, params)
    return result


@router.post("")
async def create_csv_table(
    table_data: CSVTableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    existing_table = await csv_tables_service.get_csv_table_by_name(db, table_data.name)
    if existing_table:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bảng với tên '{table_data.name}' đã tồn tại"
        )
    
    result = await csv_tables_service.create_csv_table(db, table_data)
    return JSONResponse(content=serialize_csv_table(result), status_code=status.HTTP_201_CREATED)


@router.get("/schema")
async def get_database_schema(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    tables = await csv_tables_service.get_db_schema_from_database(db)
    return JSONResponse(
        content=[serialize_csv_table(t) for t in tables], 
        status_code=status.HTTP_200_OK
    )


@router.get("/{table_id}")
async def get_csv_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    table = await csv_tables_service.get_csv_table_by_id(db, table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bảng với id '{table_id}'"
        )
    return JSONResponse(content=serialize_csv_table(table), status_code=status.HTTP_200_OK)


@router.put("/{table_id}")
async def update_csv_table_endpoint(
    table_id: int,
    table_data: CSVTableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    result = await csv_tables_service.update_csv_table(db, table_id, table_data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bảng với id '{table_id}'"
        )
    return JSONResponse(content=serialize_csv_table(result), status_code=status.HTTP_200_OK)


@router.delete("/{table_id}")
async def delete_csv_table_endpoint(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    result = await csv_tables_service.delete_csv_table(db, table_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bảng với id '{table_id}'"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)