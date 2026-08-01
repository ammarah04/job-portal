def normalize_skills(skills):
    skills = set(skill.lower() for skill in skills)

    replacements = [
    ("asp.net core", "asp.net"),
    ("entity framework core", "entity framework"),
    ("sql server", "sql"),
    ("react.js", "react"),
    ("next.js", "react"),
    ("vue.js", "vue"),
    ("tailwind css", "tailwind"),
    ("redux toolkit", "redux"),
    ("rest api", "web api"),
]

    for specific, generic in replacements:
        if specific in skills:
            skills.discard(generic)

    return sorted(skills)