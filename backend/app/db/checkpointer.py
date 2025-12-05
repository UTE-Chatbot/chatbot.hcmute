from app.core.config import settings
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

postgres_saver: AsyncPostgresSaver | None = None

async def get_checkpointer():
    global postgres_saver
    if postgres_saver is None:
        print("init")
        pool = AsyncConnectionPool(
            conninfo=settings.database_url_no_asyncpg,
            open=True,            
            max_size=10,          
            kwargs={"autocommit": True}
        )

        postgres_saver = AsyncPostgresSaver(pool)
        await postgres_saver.setup()

    return postgres_saver
