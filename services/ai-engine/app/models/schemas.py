from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    job_description: Optional[str] = None

class AnalyzeResponse(BaseModel):
    status: str
    message: str
    job_id: Optional[str] = None
    filename: Optional[str] = None
    storage_url: Optional[str] = None

class ResumeAnalysisResult(BaseModel):
    score: float
    reasoning: str
    status: str
