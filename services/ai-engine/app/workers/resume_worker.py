import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_resume(job_data):
    """
    Process resume analysis job directly (Synchronous mode)
    
    Args:
        job_data: dict containing resume data
        
    Returns:
        dict: Analysis results with score and reasoning
    """
    try:
        logger.info(f"Processing resume: {job_data.get('filename', 'unknown')}")
        
        pdf_content = bytes.fromhex(job_data["pdf_content"])
        job_description = job_data["job_description"]
        filename = job_data.get("filename", "unknown.pdf")
        
        # Step 1: Extract text from PDF
        logger.info(f"Extracting text from {filename}")
        from app.services.extractor import extract_text_from_pdf
        resume_text = extract_text_from_pdf(pdf_content)
        
        # Step 2: Generate embeddings
        logger.info("Generating embeddings")
        from app.services.embeddings import generate_embeddings, chunk_text
        resume_chunks = chunk_text(resume_text)
        resume_embeddings = generate_embeddings(resume_chunks)
        
        # Step 3: Calculate similarity with job description
        logger.info("Calculating similarity score")
        from app.services.scorer import calculate_similarity_score
        job_embeddings = generate_embeddings([job_description])
        similarity_score = calculate_similarity_score(
            resume_embeddings, 
            job_embeddings[0]
        )
        
        # Step 4: Generate LLM reasoning
        logger.info("Generating reasoning summary")
        from app.services.llm import generate_reasoning_summary
        reasoning = await generate_reasoning_summary(
            resume_text, 
            job_description, 
            similarity_score
        )
        
        result = {
            "status": "completed",
            "score": float(similarity_score),
            "reasoning": reasoning,
            "filename": filename
        }
        
        logger.info(f"Analysis completed successfully with score {similarity_score}")
        return result
        
    except Exception as e:
        logger.error(f"Resume processing failed: {str(e)}", exc_info=True)
        raise Exception(f"Failed to process resume: {str(e)}")

