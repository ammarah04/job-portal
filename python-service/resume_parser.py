import re
from pdf_extractor import extract_text_from_pdf

SECTION_HEADERS = {
    "skills": [
        "skills",
        "technical skills",
        "technologies",
        "tech stack"
    ],

    "experience": [
        "experience",
        "work experience",
        "employment",
        "professional experience"
    ],

    "projects": [
        "projects",
        "academic projects",
        "personal projects"
    ],

    "education": [
        "education",
        "academic background",
        "qualification",
        "qualifications"
    ],

    "certifications": [
        "certifications",
        "certificates",
        "licenses"
    ]
}


def parse_resume(text: str):

    # Normalize line endings
    text = text.replace("\r\n", "\n")

    # Split into lines
    lines = [line.strip() for line in text.split("\n")]

    parsed = {
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": []
    }

    current_section = None

    for line in lines:

        if not line:
            continue

        lower = line.lower()

        # Detect section heading
        found = False

        for section, headers in SECTION_HEADERS.items():

            if lower in headers:
                current_section = section
                found = True
                break

        if found:
            continue

        # Store line in detected section
        if current_section:
            parsed[current_section].append(line)

    return parsed            

if __name__ == "__main__":

    resume_text = extract_text_from_pdf(r"D:\rag\resumeAlpha.pdf")

    result = parse_resume(resume_text)

    from pprint import pprint
    pprint(result)