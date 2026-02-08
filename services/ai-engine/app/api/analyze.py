from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.workers.resume_worker import process_resume
import json
import os
import uuid
import asyncio
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# In-memory storage for results (Mocking Redis for local dev)
# In production, use a proper DB
job_results = {}

@router.post("/upload", response_model=AnalyzeResponse)
async def analyze_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_description: str = None
):
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Create uploads directory if it doesn't exist
        upload_dir = "app/uploads/resumes"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Read content
        pdf_content = await file.read()
        
        # Save file locally
        with open(file_path, "wb") as f:
            f.write(pdf_content)
        
        # Generate job ID
        job_id = f"resume-{unique_filename.split('.')[0]}"
        
        job_data = {
            "pdf_content": pdf_content.hex(),
            "job_description": job_description or "General resume analysis",
            "filename": file.filename,
            "storage_path": file_path
        }
        
        # Initialize job status
        job_results[job_id] = {"status": "processing"}

        # Define processing task wrapper
        async def process_task(jid, data):
            try:
                result = await process_resume(data)
                job_results[jid] = {"status": "completed", "result": result}
            except Exception as e:
                job_results[jid] = {"status": "failed", "error": str(e)}

        # Run via BackgroundTasks (FastAPI native) or asyncio.create_task
        # Using create_task to ensure it runs even if request finishes
        asyncio.create_task(process_task(job_id, job_data))
        
        return AnalyzeResponse(
            status="queued",
            message="Resume uploaded and processing started",
            job_id=job_id,
            filename=file.filename,
            storage_url=file_path
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a job (from in-memory store)"""
    try:
        job = job_results.get(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": job_id,
            "status": job["status"],
            "progress": 100 if job["status"] == "completed" else 50, # Mock progress
            "result": job.get("result")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job status: {str(e)}")
