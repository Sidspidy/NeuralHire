from fastapi import APIRouter
import redis.asyncio as redis
import os

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint with Redis connectivity verification"""
    try:
        # Check Redis connectivity
        redis_client = redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        redis_status = "connected"
    except Exception as e:
        redis_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": "2026-01-27T07:50:00Z",
        "service": "ai-engine",
        "redis": redis_status,
    }
