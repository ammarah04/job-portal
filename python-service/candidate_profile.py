from resume_parser import parse_resume
from skill_extractor import extract_skills


def get_experience_level(parsed_resume):

    experience = parsed_resume["experience"]
    projects = parsed_resume["projects"]

    score = len(experience) + len(projects)

    if score >= 12:
        return "Senior"

    elif score >= 6:
        return "Mid-Level"

    return "Junior"


def get_strengths(skills):

    strengths = []

    backend = {
        "asp.net core",
        ".net",
        "entity framework core",
        "sql server",
        "jwt",
        "rest api"
    }

    frontend = {
        "react",
        "javascript",
        "html",
        "css"
    }

    ai = {
        "python",
        "fastapi",
        "qdrant",
        "sbert",
        "gpt"
    }

    skill_set = {s.lower() for s in skills}

    if len(skill_set & backend) >= 3:
        strengths.append("Strong Backend Development")

    if len(skill_set & frontend) >= 2:
        strengths.append("Frontend Development")

    if len(skill_set & ai) >= 2:
        strengths.append("AI / Machine Learning")

    if "sql server" in skill_set or "mysql" in skill_set:
        strengths.append("Database Development")

    return strengths

def build_candidate_profile(
        resume_text,
        match_percentage,
        matched_skills,
        missing_skills
):

    parsed = parse_resume(resume_text)

    skills = extract_skills(resume_text)

    recommendation = (
        "Highly Recommended"
        if match_percentage >= 85
        else "Recommended"
        if match_percentage >= 70
        else "Consider"
        if match_percentage >= 50
        else "Not Recommended"
    )

    profile = {

        "experience_level":
            get_experience_level(parsed),

        "education":
            parsed["education"],

        "projects":
            parsed["projects"],

        "certifications":
            parsed["certifications"],

        "skills":
            sorted(set(skills)),

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "overall_match":
            match_percentage,

        "strengths":
            get_strengths(skills),

        "recommendation":
            recommendation
    }

    return profile