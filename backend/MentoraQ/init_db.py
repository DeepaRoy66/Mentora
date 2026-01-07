import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"

async def init_database():
    """Initialize the database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["qa_platform"]
    
    # Create collections if they don't exist
    await db.create_collection("questions")
    await db.create_collection("answers")
    
    # Create indexes
    await db["questions"].create_index("created_at")
    await db["questions"].create_index("tags")
    await db["answers"].create_index("question_id")
    
    print("Database initialized successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
