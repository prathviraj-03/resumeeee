"""
question_generator.py — Dynamic JD-Aware Interview Question Generation using LangChain.
"""

import json
import logging
import asyncio
from typing import List

from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from app.chains.eval_chain import get_llm
from app.config.settings import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert technical recruiter and interviewer.
Your task is to generate {num_questions} {session_type} interview questions tailored to a specific Job Description (JD) and the candidate's Profile.

Follow these rules:
1. Questions must be directly relevant to the skills and responsibilities in the JD.
2. If the candidate's Profile shows they lack a skill required in the JD, ask a question to probe their ability to learn or adapt to it.
3. If the session type is "behavioral", focus on STAR method questions (e.g., "Tell me about a time...").
4. If the session type is "technical", focus on the core technologies in the JD.
5. If the session type is "hr", focus on cultural fit, work style, and career goals based on the JD.

Respond ONLY with valid JSON in the following exact format:
[
  {
    "question_text": "<The actual question>",
    "category": "<A short label like 'Python', 'Leadership', or 'System Design'>",
    "difficulty": "<easy|medium|hard>",
    "follow_up_hint": "<An optional hint for the evaluator on what to look for in a good answer>"
  }
]
Do not include any other text, markdown blocks, or explanation.
"""

USER_PROMPT = """
Number of questions: {num_questions}
Session Type: {session_type}
Difficulty Level: {difficulty}

Job Description:
{job_description}

Candidate Profile:
{profile_data}
"""

async def generate_dynamic_questions(
    session_type: str,
    job_description: str,
    profile_data: dict,
    num_questions: int = 5,
    difficulty: str = "medium"
) -> List[dict]:
    """Generate dynamic questions using the LLM based on JD and Profile."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])
    
    chain = prompt | get_llm() | StrOutputParser()
    
    # Format profile data to be a concise string for the prompt
    profile_str = ""
    if profile_data:
        profile_str += f"Skills: {', '.join(profile_data.get('skills', []))}\n"
        if profile_data.get('experience'):
            for exp in profile_data['experience'][:3]:  # Take top 3
                profile_str += f"- {exp.get('title')} at {exp.get('company')} ({exp.get('duration', 'N/A')})\n"
    else:
        profile_str = "No specific profile provided."
        
    try:
        raw = await asyncio.wait_for(
            chain.ainvoke({
                "num_questions": num_questions,
                "session_type": session_type,
                "difficulty": difficulty,
                "job_description": job_description[:3000],  # Truncate JD if too long
                "profile_data": profile_str
            }),
            timeout=settings.LLM_TIMEOUT + 15,
        )
        
        # Strip potential markdown fences
        raw = raw.strip().strip("```json").strip("```").strip()
        result = json.loads(raw)
        
        # Validate structure
        if not isinstance(result, list):
            raise ValueError("LLM did not return a JSON array.")
            
        return result

    except Exception as exc:
        logger.error("Dynamic question generation failed: %s", exc, exc_info=True)
        # We can throw an error or return an empty list; raising allows the caller to handle fallback.
        raise RuntimeError("Failed to generate dynamic questions") from exc
