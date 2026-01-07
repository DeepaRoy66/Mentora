from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Tag(BaseModel):
    name: str

class Comment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class Question(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    tags: List[str] = []
    votes: int = 0
    answers_count: int = 0
    comments: List[Comment] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    author: str = "Anonymous"

    class Config:
        populate_by_name = True

class Answer(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    question_id: str
    content: str
    votes: int = 0
    comments: List[Comment] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    author: str = "Anonymous"

    class Config:
        populate_by_name = True

class Vote(BaseModel):
    direction: int = 0  # 1 for upvote, -1 for downvote, 0 to remove vote

class CommentCreate(BaseModel):
    text: str
