from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from skill_extractor import extract_skills
from skill_normalizer import normalize_skills

# setup
model = SentenceTransformer('all-MiniLM-L6-v2')
client = QdrantClient(":memory:")

# create collection
client.create_collection(
    collection_name="jobs",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# fake jobs (later replaced with real ones from SQL Server)
jobs = [
    {"id": 1, "title": "ASP.NET Core Backend Developer", "description": "We need a backend developer with ASP.NET Core 8, Clean Architecture, Entity Framework Core, SQL Server, JWT authentication, refresh token rotation, BCrypt password hashing, REST API design, Swagger, dependency injection, and repository pattern. Experience with role-based authorization and EF Core migrations is required."},
    {"id": 2, "title": "React Frontend Developer", "description": "Seeking a frontend developer with React, Redux Toolkit, JavaScript, HTML, CSS, responsive design, and component-based architecture. Experience with state management and REST API integration preferred."},
    {"id": 3, "title": "Python AI Engineer", "description": "Need a Python developer with machine learning, NLP, SBERT, sentence embeddings, vector databases, Qdrant, RAG pipelines, FastAPI, semantic search, and GPT integration experience."},
    {"id": 4, "title": "Graphic Designer", "description": "Creative designer needed with Photoshop, Illustrator, Adobe XD, typography, branding, and visual design skills."},
]

def index_jobs(job_list):
    for job in job_list:

        skills = normalize_skills(
            extract_skills(job["description"])
    )
        skills_text = " ".join(skills)

        if not skills_text.strip():
            skills_text = job["description"]

        vector = model.encode(skills_text).tolist()

        print(f"\n{job['title']}")
        print("Extracted Skills:", skills)

        client.upsert(
            collection_name="jobs",
            points=[
                PointStruct(
                    id=job["id"],
                    vector=vector,
                    payload={
                        "title": job["title"],
                        "job_id": job["id"],
                        "skills": skills
                    }
                )
            ]
        )

    print(f"\n{len(job_list)} jobs indexed successfully\n")

# match a resume against stored jobs
def match_resume(resume_text, top_k=3):

    skills = normalize_skills(
        extract_skills(resume_text)
    )
    skills_text = " ".join(skills)

    if not skills_text.strip():
        skills_text = resume_text

    print("\nResume Skills:")
    print(skills)

    resume_vector = model.encode(skills_text).tolist()

    results = client.query_points(
        collection_name="jobs",
        query=resume_vector,
        limit=top_k
    )

    matches = []

    for r in results.points:
        matches.append({
            "job_id": r.payload["job_id"],
            "title": r.payload["title"],
            "match_score": round(r.score * 100, 2)
        })

    return matches

# run
if __name__ == "__main__":
    index_jobs(jobs)

    from pdf_extractor import extract_text_from_pdf
    resume = extract_text_from_pdf(r"D:\rag\resume.pdf")
    print(f"Resume: {resume}\n")
    print("Top Matching Jobs:")
    print("-" * 40)

    matches = match_resume(resume)
    for i, match in enumerate(matches, 1):
        print(f"{i}. {match['title']}")
        print(f"  Match Score: {match['match_score']}%\n")