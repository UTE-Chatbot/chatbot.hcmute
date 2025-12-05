from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, DateTime
from datetime import datetime
import pkgutil
import importlib
import app.models

Base = declarative_base()

class BaseModel:
    """Base model that adds created_at and updated_at timestamp columns."""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

for _, module_name, _ in pkgutil.iter_modules(app.models.__path__):
    importlib.import_module(f"app.models.{module_name}")
