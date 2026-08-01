import spacy
from spacy.matcher import PhraseMatcher

from skills import TECH_SKILLS

nlp = spacy.load("en_core_web_sm")

matcher = PhraseMatcher(nlp.vocab, attr="LOWER")

patterns = [nlp.make_doc(skill) for skill in TECH_SKILLS]

matcher.add("TECH_SKILLS", patterns)


def extract_skills(text: str) -> list[str]:
    """
    Extract technical skills from resume or job description.
    """

    doc = nlp(text)

    matches = matcher(doc)

    skills = set()

    for _, start, end in matches:
        skills.add(doc[start:end].text)

    return sorted(skills)