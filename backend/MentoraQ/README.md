# Q&A Platform Backend

FastAPI backend for the Q&A platform with MongoDB.

## Setup

1. Install Python 3.9+
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Ensure MongoDB is running locally on port 27017 or update `.env` with your MongoDB URL

5. Initialize the database:
   ```bash
   python init_db.py
   ```

6. Seed the database (optional):
   ```bash
   python seed_data.py
   ```

7. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /questions` - Get all questions
- `POST /questions` - Create a new question
- `GET /questions/{id}` - Get a specific question
- `GET /questions/{id}/answers` - Get answers for a question
- `POST /questions/{id}/answers` - Post an answer
- `POST /questions/{id}/comments` - Add comment to question
- `POST /answers/{id}/comments` - Add comment to answer
- `POST /vote/question/{id}` - Vote on question
- `POST /vote/answer/{id}` - Vote on answer

## MongoDB Collections

**questions**
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "votes": 0,
  "comments": [],
  "author": "Anonymous",
  "created_at": "datetime"
}
```

**answers**
```json
{
  "_id": "ObjectId",
  "question_id": "string",
  "content": "string",
  "votes": 0,
  "comments": [],
  "author": "Anonymous",
  "created_at": "datetime"
}
