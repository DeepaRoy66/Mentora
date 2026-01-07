from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from models import Question, Answer, Comment, Vote, CommentCreate
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Q&A Platform API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db: AsyncIOMotorDatabase = client["qa_platform"]

# Collections
questions_collection = db["questions"]
answers_collection = db["answers"]

@app.on_event("startup")
async def startup():
    """Create indexes on startup"""
    await questions_collection.create_index("created_at")
    await questions_collection.create_index("tags")
    await answers_collection.create_index("question_id")
    print("Connected to MongoDB and created indexes")

@app.on_event("shutdown")
async def shutdown():
    """Close MongoDB connection"""
    client.close()

# Helper functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    return None

# Questions routes
@app.get("/questions")
async def get_questions():
    """Get all questions"""
    questions = []
    async for question in questions_collection.find().sort("created_at", -1):
        question_data = serialize_doc(question)
        # Count answers
        answers_count = await answers_collection.count_documents({"question_id": str(question["_id"])})
        question_data["answers_count"] = answers_count
        questions.append(question_data)
    return questions

@app.post("/questions")
async def create_question(question: Question):
    """Create a new question"""
    question_dict = question.dict()
    question_dict["created_at"] = datetime.utcnow()
    question_dict["votes"] = 0
    question_dict["comments"] = []
    result = await questions_collection.insert_one(question_dict)
    created_question = await questions_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_question)

@app.get("/questions/{question_id}")
async def get_question(question_id: str):
    """Get a specific question"""
    try:
        question = await questions_collection.find_one({"_id": ObjectId(question_id)})
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return serialize_doc(question)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/questions/{question_id}/answers")
async def get_answers(question_id: str):
    """Get answers for a question"""
    answers = []
    async for answer in answers_collection.find({"question_id": question_id}).sort("votes", -1):
        answers.append(serialize_doc(answer))
    return answers

@app.post("/questions/{question_id}/answers")
async def create_answer(question_id: str, answer: Answer):
    """Post an answer to a question"""
    # Verify question exists
    question = await questions_collection.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answer_dict = answer.dict()
    answer_dict["question_id"] = question_id
    answer_dict["created_at"] = datetime.utcnow()
    answer_dict["votes"] = 0
    answer_dict["comments"] = []
    
    result = await answers_collection.insert_one(answer_dict)
    created_answer = await answers_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_answer)

@app.post("/questions/{question_id}/comments")
async def add_question_comment(question_id: str, comment_data: CommentCreate):
    """Add a comment to a question"""
    try:
        result = await questions_collection.update_one(
            {"_id": ObjectId(question_id)},
            {
                "$push": {
                    "comments": {
                        "_id": str(ObjectId()),
                        "text": comment_data.text,
                        "created_at": datetime.utcnow()
                    }
                }
            }
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/answers/{answer_id}/comments")
async def add_answer_comment(answer_id: str, comment_data: CommentCreate):
    """Add a comment to an answer"""
    try:
        result = await answers_collection.update_one(
            {"_id": ObjectId(answer_id)},
            {
                "$push": {
                    "comments": {
                        "_id": str(ObjectId()),
                        "text": comment_data.text,
                        "created_at": datetime.utcnow()
                    }
                }
            }
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Answer not found")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Voting routes
@app.post("/vote/question/{question_id}")
async def vote_question(question_id: str, vote: Vote):
    """Upvote or downvote a question"""
    try:
        question = await questions_collection.find_one({"_id": ObjectId(question_id)})
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        current_votes = question.get("votes", 0)
        new_votes = current_votes + vote.direction
        
        await questions_collection.update_one(
            {"_id": ObjectId(question_id)},
            {"$set": {"votes": new_votes}}
        )
        
        updated_question = await questions_collection.find_one({"_id": ObjectId(question_id)})
        return {"votes": updated_question["votes"], "_id": str(question_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/vote/answer/{answer_id}")
async def vote_answer(answer_id: str, vote: Vote):
    """Upvote or downvote an answer"""
    try:
        answer = await answers_collection.find_one({"_id": ObjectId(answer_id)})
        if not answer:
            raise HTTPException(status_code=404, detail="Answer not found")
        
        current_votes = answer.get("votes", 0)
        new_votes = current_votes + vote.direction
        
        await answers_collection.update_one(
            {"_id": ObjectId(answer_id)},
            {"$set": {"votes": new_votes}}
        )
        
        updated_answer = await answers_collection.find_one({"_id": ObjectId(answer_id)})
        return {"votes": updated_answer["votes"], "_id": str(answer_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    """API health check"""
    return {"status": "ok", "message": "Q&A Platform API"}
