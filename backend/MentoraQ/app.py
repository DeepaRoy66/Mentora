from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["MentoraDB"]
    questions_col = db["questions"]
    answers_col = db["answers"]
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

def parse_json(data):
    """Convert MongoDB ObjectId to string."""
    for item in data:
        item["_id"] = str(item["_id"])
    return data

# --- 1. GET: List all questions ---
@app.route('/MentoraQ/questions', methods=['GET'])
def get_questions():
    try:
        questions = list(questions_col.find().sort("_id", -1))
        return jsonify(parse_json(questions)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 2. POST: Create a new question ---
@app.route('/backend/MentoraQ/questions', methods=['POST'])
def create_question():
    try:
        data = request.json
        
        if not data or not data.get('title'):
            return jsonify({"error": "Title is required"}), 400

        new_question = {
            "title": data.get("title"),
            "description": data.get("description", ""),
            "tags": data.get("tags", []),
            "created_at": datetime.now(timezone.utc), # Matches frontend expectation
            "votes": 0,                                # Matches frontend expectation
            "comments": []                             # Matches frontend expectation
        }

        result = questions_col.insert_one(new_question)
        created_doc = questions_col.find_one({"_id": result.inserted_id})
        
        created_doc["_id"] = str(created_doc["_id"])
        # Convert datetime to string for JSON response
        created_doc["created_at"] = created_doc["created_at"].isoformat()
        
        return jsonify(created_doc), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 3. GET: Single Question Details (FIX FOR 404) ---
@app.route('/backend/MentoraQ/questions/<id>', methods=['GET'])
def get_question_detail(id):
    try:
        oid = ObjectId(id)
        question = questions_col.find_one({"_id": oid})
        
        if not question:
            return jsonify({"error": "Question not found"}), 404
            
        # Convert ObjectId to string
        question["_id"] = str(question["_id"])
        
        # Ensure frontend fields exist even if old data doesn't have them
        if "votes" not in question:
            question["votes"] = 0
        if "comments" not in question:
            question["comments"] = []
            
        # Convert datetime to string format the frontend expects
        if "created_at" in question and isinstance(question["created_at"], datetime):
            question["created_at"] = question["created_at"].isoformat()
            
        return jsonify(question), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 4. GET: Answers for a specific question (FIX FOR 404) ---
@app.route('/backend/MentoraQ/questions/<id>/answers', methods=['GET'])
def get_answers(id):
    try:
        # Find all answers associated with this question ID
        answers = list(answers_col.find({"questionId": id}))
        
        # Process answers for JSON serialization
        for ans in answers:
            ans["_id"] = str(ans["_id"])
            # Handle datetime
            if "created_at" in ans and isinstance(ans["created_at"], datetime):
                ans["created_at"] = ans["created_at"].isoformat()
                
        return jsonify(answers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)