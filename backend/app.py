import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables
current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, '.env'))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- DATABASE SETUP ---
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    print("❌ ERROR: MONGO_URI is missing!")
else:
    try:
        client = MongoClient(mongo_uri)
        
        # ⚠️ CRITICAL: We are naming the DB 'mentora_db' explicitly
        db = client['test'] 
        users_collection = db['appUsers']
        
        print(f"✅ Connected to MongoDB! Saving data to database: 'mentora_db'")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

@app.route('/')
def home():
    return "✅ Python Server is Running."

@app.route('/api/sync-user', methods=['POST'])
def sync_user():
    print("\n🔹 INCOMING SIGN-IN REQUEST 🔹")
    data = request.json
    print(f"📥 Received Payload: {data}")
    
    email = data.get('email')
    
    if not email:
        print("❌ Error: Email is missing from request")
        return jsonify({"error": "No email"}), 400

    user_data = {
        "email": email,
        "name": data.get('name'),
        "image": data.get('image'),
    }

    try:
        # Save to DB
        result = users_collection.update_one(
            {"email": email},
            {"$set": user_data},
            upsert=True
        )
        
        # Print exact success message
        if result.upserted_id:
            print(f"🎉 NEW USER CREATED in 'mentora_db': {email}")
        else:
            print(f"✅ USER UPDATED in 'mentora_db': {email}")
            
        return jsonify({"success": True}), 200
    except Exception as e:
        print(f"❌ DB WRITE ERROR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user-stats', methods=['GET'])
def get_user_stats():
    email = request.args.get('email')
    user = users_collection.find_one({"email": email}, {"_id": 0})
    return jsonify(user if user else {})

if __name__ == '__main__':
    app.run(debug=True, port=5000)