"""
question_seeds.py — Sample questions for all session types.
Call POST /api/interview/questions/seed to load these.
"""

SEED_QUESTIONS = [

    # ── TECHNICAL — System Design ──────────────────────────────────────────
    {
        "question_text": "Design a URL shortening service like bit.ly. Walk through your system design including the database schema, API design, and how you'd handle 100 million URLs.",
        "category": "System Design",
        "difficulty": "hard",
        "session_type": "technical",
        "follow_up_hint": "Ask about cache invalidation and hash collision handling.",
    },
    {
        "question_text": "How would you design a rate limiter for an API gateway that needs to handle 10,000 requests per second?",
        "category": "System Design",
        "difficulty": "hard",
        "session_type": "technical",
        "follow_up_hint": "Probe for token bucket vs sliding window algorithms.",
    },
    {
        "question_text": "Explain the CAP theorem and give a real-world example where you had to choose between consistency and availability.",
        "category": "System Design",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "Design a notification service that supports email, SMS, and push notifications at scale.",
        "category": "System Design",
        "difficulty": "hard",
        "session_type": "technical",
    },
    {
        "question_text": "How would you design the data model for a multi-tenant SaaS application?",
        "category": "System Design",
        "difficulty": "medium",
        "session_type": "technical",
    },

    # ── TECHNICAL — Data Structures & Algorithms ───────────────────────────
    {
        "question_text": "Explain the difference between a stack and a queue. When would you use each? Can you implement a queue using two stacks?",
        "category": "Data Structures",
        "difficulty": "easy",
        "session_type": "technical",
    },
    {
        "question_text": "What is the time and space complexity of quicksort? When does it degrade to O(n²) and how can you prevent that?",
        "category": "Algorithms",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "Explain how a hash map works internally. What happens during a collision? Describe at least two collision resolution strategies.",
        "category": "Data Structures",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "What is dynamic programming? Explain with an example — solve the coin change problem.",
        "category": "Algorithms",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "Describe BFS and DFS. When would you choose one over the other?",
        "category": "Algorithms",
        "difficulty": "easy",
        "session_type": "technical",
    },

    # ── TECHNICAL — Databases ──────────────────────────────────────────────
    {
        "question_text": "What is database indexing and how does a B-tree index work? What are the trade-offs of adding indexes?",
        "category": "Databases",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "Explain ACID properties in databases. Give an example of a situation where each property matters.",
        "category": "Databases",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "When would you choose a NoSQL database over a relational database? Give concrete examples.",
        "category": "Databases",
        "difficulty": "easy",
        "session_type": "technical",
    },
    {
        "question_text": "What is database sharding? What are the challenges associated with it and how do you handle them?",
        "category": "Databases",
        "difficulty": "hard",
        "session_type": "technical",
    },
    {
        "question_text": "Explain what N+1 query problem is and how you would resolve it in an ORM like SQLAlchemy.",
        "category": "Databases",
        "difficulty": "medium",
        "session_type": "technical",
    },

    # ── TECHNICAL — Backend / Python ───────────────────────────────────────
    {
        "question_text": "What is the GIL in Python and how does it affect multi-threaded programs? How do you work around its limitations?",
        "category": "Python",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "Explain async/await in Python. How does the event loop work and when should you use asyncio?",
        "category": "Python",
        "difficulty": "medium",
        "session_type": "technical",
    },
    {
        "question_text": "What are Python decorators? Write a decorator that logs the execution time of any function.",
        "category": "Python",
        "difficulty": "easy",
        "session_type": "technical",
    },
    {
        "question_text": "What is the difference between a REST API and a GraphQL API? When would you choose GraphQL?",
        "category": "API Design",
        "difficulty": "easy",
        "session_type": "technical",
    },
    {
        "question_text": "Explain microservices architecture. What are the key challenges — service discovery, inter-service communication, and distributed tracing?",
        "category": "Architecture",
        "difficulty": "hard",
        "session_type": "technical",
    },

    # ── BEHAVIORAL ─────────────────────────────────────────────────────────
    {
        "question_text": "Tell me about a time you had to deal with a difficult teammate or stakeholder. How did you handle it and what was the outcome?",
        "category": "Conflict Resolution",
        "difficulty": "medium",
        "session_type": "behavioral",
        "follow_up_hint": "Look for STAR format — Situation, Task, Action, Result.",
    },
    {
        "question_text": "Describe a project where you had to learn a completely new technology under tight time pressure. How did you approach it?",
        "category": "Learning Agility",
        "difficulty": "easy",
        "session_type": "behavioral",
    },
    {
        "question_text": "Tell me about the most technically challenging project you've worked on. What made it hard and how did you overcome the obstacles?",
        "category": "Technical Leadership",
        "difficulty": "medium",
        "session_type": "behavioral",
    },
    {
        "question_text": "Describe a situation where you disagreed with your manager's technical decision. What did you do?",
        "category": "Conflict Resolution",
        "difficulty": "medium",
        "session_type": "behavioral",
    },
    {
        "question_text": "Tell me about a time you failed. What happened, what did you learn, and how did you change your approach afterward?",
        "category": "Self Awareness",
        "difficulty": "medium",
        "session_type": "behavioral",
    },
    {
        "question_text": "Describe a time you had to prioritize multiple competing deadlines. How did you decide what to work on first?",
        "category": "Time Management",
        "difficulty": "easy",
        "session_type": "behavioral",
    },
    {
        "question_text": "Give an example of when you took ownership of a problem outside your immediate responsibilities. What drove you to step up?",
        "category": "Ownership",
        "difficulty": "medium",
        "session_type": "behavioral",
    },
    {
        "question_text": "Tell me about a time you had to make a decision with incomplete information. How did you proceed?",
        "category": "Decision Making",
        "difficulty": "hard",
        "session_type": "behavioral",
    },
    {
        "question_text": "Describe a time you mentored a junior developer. What did you teach them and how did you measure success?",
        "category": "Leadership",
        "difficulty": "medium",
        "session_type": "behavioral",
    },
    {
        "question_text": "Tell me about a time you received critical feedback. How did you react and what did you do differently?",
        "category": "Self Awareness",
        "difficulty": "easy",
        "session_type": "behavioral",
    },

    # ── HR ─────────────────────────────────────────────────────────────────
    {
        "question_text": "Tell me about yourself and walk me through your career so far.",
        "category": "Introduction",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "Why are you looking for a new opportunity right now?",
        "category": "Motivation",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "Where do you see yourself professionally in 5 years?",
        "category": "Career Goals",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "What are your biggest strengths and how have they helped you in your career?",
        "category": "Self Assessment",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "What is your biggest weakness and what are you actively doing to improve it?",
        "category": "Self Assessment",
        "difficulty": "medium",
        "session_type": "hr",
    },
    {
        "question_text": "Why do you want to work at our company specifically?",
        "category": "Motivation",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "How do you handle stress and pressure at work? Give a specific example.",
        "category": "Work Style",
        "difficulty": "medium",
        "session_type": "hr",
    },
    {
        "question_text": "Describe your ideal work environment and team culture.",
        "category": "Culture Fit",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "How do you keep your technical skills up to date?",
        "category": "Learning",
        "difficulty": "easy",
        "session_type": "hr",
    },
    {
        "question_text": "What are your salary expectations and what factors are most important to you in a compensation package?",
        "category": "Compensation",
        "difficulty": "medium",
        "session_type": "hr",
    },
]
