"""
Migration script to migrate CSV table data from JSON file to database.
Run this once to migrate existing data.
"""
import asyncio
import os
import json
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.csv_table import CSVTable


async def migrate_json_to_db():
    json_path = os.path.join(
        os.path.dirname(__file__), 
        '../app/assets/json/csv_tables.json'
    )
    
    if not os.path.exists(json_path):
        print("No JSON file found at", json_path)
        print("Nothing to migrate.")
        return
    
    with open(json_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    tables = data.get("tables", [])
    
    if not tables:
        print("No tables found in JSON file.")
        return
    
    async with AsyncSessionLocal() as session:
        migrated_count = 0
        skipped_count = 0
        
        for table_data in tables:
            name = table_data.get("name")
            
            # Check if table already exists
            from sqlalchemy import select
            result = await session.execute(
                select(CSVTable).where(CSVTable.name == name)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"Skipping '{name}' - already exists in database")
                skipped_count += 1
                continue
            
            # Create new table record
            csv_table = CSVTable(
                name=name,
                url=table_data.get("url"),
                description=table_data.get("description"),
                columns=table_data.get("columns", [])
            )
            
            session.add(csv_table)
            migrated_count += 1
            print(f"Migrated table: {name}")
        
        await session.commit()
        
        print(f"\nMigration complete!")
        print(f"Migrated: {migrated_count} tables")
        print(f"Skipped: {skipped_count} tables (already exist)")
        
        # Optionally rename the JSON file as backup
        backup_path = json_path + '.backup'
        if migrated_count > 0:
            os.rename(json_path, backup_path)
            print(f"\nOriginal JSON file backed up to: {backup_path}")


if __name__ == "__main__":
    print("Starting CSV tables migration from JSON to database...\n")
    asyncio.run(migrate_json_to_db())
