import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId

MONGO_URL = "mongodb://localhost:27017"

async def seed_database():
    """Seed the database with sample data"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["qa_platform"]
    
    # Clear existing data
    await db["questions"].delete_many({})
    await db["answers"].delete_many({})
    
    # Sample questions
    questions_data = [
        {
            "title": "How to get started with React?",
            "description": "I'm a beginner in web development. What's the best way to learn React? Are there any good tutorials or resources?",
            "tags": ["react", "javascript", "beginner"],
            "votes": 5,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        },
        {
            "title": "What's the difference between async/await and promises?",
            "description": "I understand promises but I'm confused about when to use async/await. Can someone explain the differences?",
            "tags": ["javascript", "async"],
            "votes": 12,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        },
        {
            "title": "Best practices for MongoDB schema design",
            "description": "I'm designing a MongoDB schema for my e-commerce app. What are the best practices to follow?",
            "tags": ["mongodb", "database", "schema-design"],
            "votes": 8,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Insert questions
    questions_result = await db["questions"].insert_many(questions_data)
    question_ids = questions_result.inserted_ids
    
    # Sample answers
    answers_data = [
        {
            "question_id": str(question_ids[0]),
            "content": "Start with the official React documentation at react.dev. Then practice by building small projects. The React tutorial is great for beginners!",
            "votes": 3,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        },
        {
            "question_id": str(question_ids[0]),
            "content": "I recommend following along with Scrimba's React course. It's interactive and very beginner-friendly.",
            "votes": 2,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        },
        {
            "question_id": str(question_ids[1]),
            "content": "async/await is syntactic sugar over promises that makes code look more like synchronous code. It's cleaner to read and write!",
            "votes": 8,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        },
        {
            "question_id": str(question_ids[2]),
            "content": "Denormalize thoughtfully, but keep related data together. Use subdocuments for 1-to-few relationships and arrays for related items.",
            "votes": 5,
            "comments": [],
            "author": "Anonymous",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db["answers"].insert_many(answers_data)
    
    print("Database seeded successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
