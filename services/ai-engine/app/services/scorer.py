from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List

def calculate_similarity_score(embedding1: List[float], embedding2: List[float]) -> float:
    """Calculate cosine similarity between two embeddings"""
    try:
        vec1 = np.array(embedding1).reshape(1, -1)
        vec2 = np.array(embedding2).reshape(1, -1)
        
        similarity = cosine_similarity(vec1, vec2)[0][0]
        
        score = float(similarity * 100)
        return round(score, 2)
    
    except Exception as e:
        raise Exception(f"Failed to calculate similarity: {str(e)}")

def calculate_average_similarity(resume_embeddings: List[List[float]], job_embedding: List[float]) -> float:
    """Calculate average similarity across multiple resume chunks"""
    try:
        scores = []
        for resume_emb in resume_embeddings:
            score = calculate_similarity_score(resume_emb, job_embedding)
            scores.append(score)
        
        return round(np.mean(scores), 2)
    
    except Exception as e:
        raise Exception(f"Failed to calculate average similarity: {str(e)}")
