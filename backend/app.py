from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ Import this
from pymongo import MongoClient
import os
from datetime import datetime

app = Flask(__name__)

# ✅ ENABLE CORS: Allow Next.js (port 3000) to talk to this server
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000"]}})

# Database Connection (Replace with your actual URI)
# ⚠️ MAKE SURE THIS URI IS CORRECT
client = MongoClient("mongodb+srv://YOUR_MONGO_URI_HERE") 
db = client['test'] 
users_collection = db['appUsers']

@app.route('/api/sync-user', methods=['POST'])
def sync_user():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email required"}), 400

    user_data = {
        "email": email,
        "name": data.get('name'),
        "image": data.get('image'),
    }

    # Upsert user
    users_collection.update_one(
        {"email": email},
        {
            "$set": user_data,
            "$setOnInsert": {"contributionPoints": 0, "createdAt": datetime.now()}
        },
        upsert=True
    )
    
    return jsonify({"success": True}), 200

@app.route('/api/user-stats', methods=['GET'])
def get_user_stats():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400

    user = users_collection.find_one({"email": email}, {"_id": 0})
    
    if not user:
        return jsonify({"contributionPoints": 0, "notesCount": 0, "badgesCount": 0})
        
    return jsonify({
        "contributionPoints": user.get('contributionPoints', 0),
        "notesCount": 9, # Placeholder
        "badgesCount": 4, # Placeholder
        "image": user.get('image', "") # Send image back
    })

if __name__ == '__main__':
    # ✅ Run on Port 5000
    app.run(debug=True, port=5000)