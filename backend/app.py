# backend/app.py
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load env
load_dotenv()
mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri)
db = client.get_default_database()  # Uses DB from URI
users_collection = db["appUsers"]

print("✅ Connected to MongoDB:", db.name)

# FastAPI app
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for /sync-user
class SyncUserModel(BaseModel):
    name: str
    email: str
    image: str | None = None

@app.post("/sync-user")
async def sync_user(data: SyncUserModel):
    email = data.email
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    try:
        result = users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "name": data.name,
                    "image": data.image,
                    "lastLogin": datetime.now(timezone.utc),
                },
                "$setOnInsert": {
                    "contributionPoints": 0,
                    "notesCount": 0,
                    "badgesCount": 0,
                    "createdAt": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )
        print("Matched:", result.matched_count, "Upserted:", result.upserted_id)
        return {"success": True}
    except Exception as e:
        print("❌ DB Error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/user-stats")
async def user_stats(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    user = users_collection.find_one({"email": email}, {"_id": 0})
    if not user:
        return {
            "contributionPoints": 0,
            "notesCount": 0,
            "badgesCount": 0,
        }
    return user


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
