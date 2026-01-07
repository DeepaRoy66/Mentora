# Q&A Platform - Complete Setup Guide

This is a full-stack Q&A + discussion platform with Next.js frontend, FastAPI backend, and MongoDB database.

## Project Structure

```
qa-platform/
├── frontend/           # Next.js app (React with .jsx)
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── ...
└── backend/            # FastAPI app (Python)
    ├── main.py         # FastAPI routes
    ├── models.py       # Pydantic models
    ├── requirements.txt
    ├── .env            # Environment variables
    ├── init_db.py      # Database initialization
    └── seed_data.py    # Sample data
```

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- MongoDB 5.0+ (running locally or Atlas URL)

## Backend Setup (FastAPI + MongoDB)

### 1. Install MongoDB

**Local Setup:**
- Download and install from https://www.mongodb.com/try/download/community
- Run MongoDB locally: `mongod`

**or Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/`

### 2. Backend Configuration

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure .env file with your MongoDB URL
# MONGO_URL=mongodb://localhost:27017
# or
# MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/

# Initialize database
python init_db.py

# Seed sample data (optional)
python seed_data.py

# Run FastAPI server
uvicorn main:app --reload
```

Server runs on http://localhost:8000

## Frontend Setup (Next.js)

### 1. Frontend Installation

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on http://localhost:3000

### 2. Environment Configuration

Create or update `.env.local` file if needed. Frontend communicates with backend at:
- `http://localhost:8000`

## Features

✓ Create, read, and list questions
✓ Post answers to questions
✓ Comment on questions and answers
✓ Upvote/downvote questions and answers
✓ Tag system for questions
✓ Minimal, clean UI (Discord light mode)
✓ Fully anonymous (no authentication)
✓ Responsive mobile-first design
✓ No extra UI libraries (pure Tailwind CSS)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/questions` | Get all questions |
| POST | `/questions` | Create new question |
| GET | `/questions/{id}` | Get specific question |
| GET | `/questions/{id}/answers` | Get answers for question |
| POST | `/questions/{id}/answers` | Post answer to question |
| POST | `/questions/{id}/comments` | Add comment to question |
| POST | `/answers/{id}/comments` | Add comment to answer |
| POST | `/vote/question/{id}` | Vote on question |
| POST | `/vote/answer/{id}` | Vote on answer |

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (local) or check Atlas connection string
- Update MONGO_URL in backend/.env

### CORS Error in Frontend
- Backend CORS is set for `http://localhost:3000`
- If using different port, update cors_origins in main.py

### Port Already in Use
- Frontend: Change port with `npm run dev -- -p 3001`
- Backend: Change port with `uvicorn main:app --port 8001 --reload`
- Update frontend API URL accordingly

## Development Tips

1. **Hot Reload:** Both frontend and backend support hot reload during development
2. **Database Inspection:** Use MongoDB Compass or Atlas UI to inspect data
3. **API Testing:** Visit `http://localhost:8000/docs` for FastAPI interactive docs
4. **Logging:** Add `console.log()` in frontend and `print()` in backend for debugging

## Deployment

For production deployment:
1. Build frontend: `npm run build`
2. Deploy backend to service like Railway, Render, or Heroku
3. Update frontend API URL to production backend URL
4. Use MongoDB Atlas for database
5. Set environment variables in deployment platform

---

**Happy coding!** 🚀
