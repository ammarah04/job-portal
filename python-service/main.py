from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from matcher import index_jobs, match_resume, model, client
from pdf_extractor import extract_text_from_pdf
from sentence_transformers import util
import os
from skill_normalizer import normalize_skills
from skill_extractor import extract_skills
from candidate_profile import build_candidate_profile

BASE_UPLOAD_PATH = r"C:\Users\Microsoft\source\repos\JobPortalAPI\JobPortalAPI\Uploads"

app = FastAPI(
    title="HunarAI Matching Engine",
    version="2.0"
)

class ResumeRequest(BaseModel):
    resume_text: str
    top_k: int = 5


class CVFileRequest(BaseModel):
    cv_file_path: str
    top_k: int = 5


class JobRequest(BaseModel):
    job_id: int
    title: str
    description: str


class SkillGapRequest(BaseModel):
    cv_file_path: str
    job_description: str
    job_title: str


@app.get("/health")
def health():
    return {
        "status": "HunarAI Matching Engine Running"
    }


@app.post("/match")
def match(request: ResumeRequest):

    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text cannot be empty."
        )

    matches = match_resume(
        request.resume_text,
        top_k=request.top_k
    )

    return {
        "matches": matches,
        "total": len(matches)
    }


@app.post("/match-cv")
def match_cv(request: CVFileRequest):

    base_path = r"C:\Users\Microsoft\source\repos\JobPortalAPI\JobPortalAPI\Uploads"

    full_path = os.path.join(
        base_path,
        request.cv_file_path
    )

    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=404,
            detail="CV file not found."
        )

    resume_text = extract_text_from_pdf(full_path)

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from CV."
        )

    matches = match_resume(
        resume_text,
        top_k=request.top_k
    )

    return {
        "matches": matches,
        "total": len(matches),
        "resume_preview": resume_text[:250]
    }


@app.post("/skill-gap")
def skill_gap(request: SkillGapRequest):

    base_path = r"C:\Users\Microsoft\source\repos\JobPortalAPI\JobPortalAPI\Uploads"

    full_path = os.path.join(
        base_path,
        request.cv_file_path
    )

    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=404,
            detail="CV file not found."
        )

    resume_text = extract_text_from_pdf(full_path)

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from CV."
        )

    resume_skills = set(
        normalize_skills(
            extract_skills(resume_text)
        )
    )

    job_skills = set(
        normalize_skills(
            extract_skills(request.job_description)
        )
    )

    resume_text_for_embedding = " ".join(resume_skills)
    job_text_for_embedding = " ".join(job_skills)

# Fallback if no skills were extracted
    if not resume_text_for_embedding.strip():
        resume_text_for_embedding = resume_text

    if not job_text_for_embedding.strip():
        job_text_for_embedding = request.job_description

    resume_vector = model.encode(resume_text_for_embedding)
    job_vector = model.encode(job_text_for_embedding)

    similarity = util.cos_sim(
        resume_vector,
        job_vector
    ).item()

    matched = sorted(resume_skills & job_skills)
    missing = sorted(job_skills - resume_skills)

    required_score = (
        len(matched) / len(job_skills)
        if job_skills else 1.0
    )

    bonus = min(
        len(resume_skills - job_skills) * 0.02,
        0.15
    )

    skill_score = min(required_score + bonus, 1.0)

    final_score = (
        similarity * 0.4 +
        skill_score * 0.6
    )

    match_percentage = round(final_score * 100, 2)

    candidate_profile = build_candidate_profile(
        resume_text=resume_text,
        match_percentage=match_percentage,
        matched_skills=matched,
        missing_skills=missing
    )

    print("=" * 60)
    print("Resume Skills:", sorted(resume_skills))
    print("Job Skills:", sorted(job_skills))
    print("Matched:", matched)
    print("Missing:", missing)
    print(f"Semantic Score: {similarity * 100:.2f}")
    print(f"Skill Score: {skill_score * 100:.2f}")
    print(f"Final Score: {match_percentage:.2f}")
    print("=" * 60)

    # Feedback
    if match_percentage >= 85:
        feedback = "Excellent match for this position."
    elif match_percentage >= 70:
        feedback = "Good match. A few additional skills would strengthen your profile."
    elif match_percentage >= 50:
        feedback = "Average match. Consider improving the missing skills."
    else:
        feedback = "Low match. Significant skill improvement is recommended."

# Response
    return {
        "job_title": request.job_title,
        "match_percentage": match_percentage,
        "feedback": feedback,
        "matched_skills": matched,
        "missing_skills": missing,
        "candidate_profile": candidate_profile,
        "resume_preview": resume_text[:250]
    }

@app.delete("/delete-job/{job_id}")
def delete_job(job_id: int):

    try:
        client.delete(
            collection_name="jobs",
            points_selector=[job_id]
        )

        return {
            "message": f"Job {job_id} deleted successfully."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )