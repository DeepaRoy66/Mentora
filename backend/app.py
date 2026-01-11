import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone

# Load env
load_dotenv()

mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri)

# Use the 'test' database
db = client.get_default_database()  # Will use 'test' from URI
users_collection = db["appUsers"]

print("✅ Connected to MongoDB:", db.name)

app = Flask(__name__)
CORS(app)

@app.route("/sync-user", methods=["POST"])
def sync_user():
    data = request.json
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email required"}), 400

    try:
        result = users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "name": data.get("name"),
                    "image": data.get("image"),
                    "lastLogin": datetime.now(timezone.utc)
                },
                "$setOnInsert": {
                    "contributionPoints": 0,
                    "notesCount": 0,
                    "badgesCount": 0,
                    "createdAt": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        print("Matched:", result.matched_count, "Upserted:", result.upserted_id)
        return jsonify({"success": True})
    except Exception as e:
        print("❌ DB Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/user-stats", methods=["GET"])
def user_stats():
    email = request.args.get("email")
    user = users_collection.find_one({"email": email}, {"_id": 0})
    if not user:
        return jsonify({
            "contributionPoints": 0,
            "notesCount": 0,
            "badgesCount": 0
        })
    return jsonify(user)

if __name__ == "__main__":
    app.run(debug=True, port=8000)
