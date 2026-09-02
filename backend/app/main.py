from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers.auth import router as auth_router

from . import models


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Food Calories Meter API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "AI Food Calories Meter API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }