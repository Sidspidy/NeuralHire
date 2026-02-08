from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_reasoning_summary(resume_text: str, job_description: str, score: float) -> str:
    """Generate LLM-based reasoning summary for the match score"""
    try:
        prompt = f"""
You are an expert HR analyst. Analyze the following resume against the job description and provide a concise reasoning summary.

Job Description:
{job_description}

Resume:
{resume_text[:3000]}

Match Score: {score}%

Provide a brief summary (3-5 sentences) explaining:
1. Key strengths and relevant experience
2. Potential gaps or areas of concern
3. Overall fit assessment

Summary:
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR analyst providing concise resume evaluations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7,
            timeout=30
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        raise Exception(f"Failed to generate reasoning summary: {str(e)}")
