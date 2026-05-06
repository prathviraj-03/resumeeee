import asyncio
import os
import tempfile
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.utils.logger import logger
from app.config import get_settings

settings = get_settings()

def get_jinja_env(template_dir="templates"):
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=False,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    return env

def render_html(data: dict, template_name="resume.html") -> str:
    env = get_jinja_env()
    # Default to resume.html if tex was passed
    if template_name.endswith('.tex'):
        template_name = template_name.replace('.tex', '.html')
    # If the template doesn't end with .html, append it
    if not template_name.endswith('.html'):
        template_name += '.html'
        
    try:
        template = env.get_template(template_name)
    except Exception as e:
        logger.warning("template_not_found", template=template_name, error=str(e))
        template = env.get_template("resume.html")
        
    return template.render(**data)

async def compile_pdf(html_path: str, output_path: str) -> str:
    """
    Runs the Node.js puppeteer worker to convert HTML to PDF
    """
    worker_script = os.path.join(os.path.dirname(__file__), "..", "utils", "pdf_worker.js")
    
    process = await asyncio.create_subprocess_exec(
        "node",
        worker_script,
        html_path,
        output_path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        logger.error("puppeteer_error", stderr=stderr.decode())
        raise RuntimeError(f"PDF Generation failed: {stderr.decode()}")
        
    return output_path

async def generate_resume_pdf(
    optimized, original, output_path: str, template_name: str = "resume.html"
) -> str:
    """
    Generates a PDF resume using HTML and Puppeteer.
    """
    opt_dict = optimized.model_dump() if hasattr(optimized, "model_dump") else optimized
    orig_dict = original.model_dump() if hasattr(original, "model_dump") else original

    opt_contact = opt_dict.get("contact")
    if opt_contact and opt_contact.get("name"):
        contact_info = opt_contact
    else:
        contact_info = orig_dict.get("contact", {})

    data = {
        "contact": contact_info,
        "summary": opt_dict.get("summary", ""),
        "experience": opt_dict.get("experience", []),
        "education": orig_dict.get("education", []),
        "skills": opt_dict.get("skills", []),
        "certifications": orig_dict.get("certifications", []),
        "suggestions": opt_dict.get("suggestions", []),
        "projects": orig_dict.get("projects", []),
    }

    output_dir = Path(output_path).parent
    os.makedirs(output_dir, exist_ok=True)

    rendered_html = render_html(data, template_name=template_name)

    # Use a temporary file for the HTML input
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8") as tmp_html:
        tmp_html.write(rendered_html)
        tmp_html_path = tmp_html.name

    try:
        pdf_path = await compile_pdf(tmp_html_path, output_path)
        return pdf_path
    finally:
        if os.path.exists(tmp_html_path):
            os.remove(tmp_html_path)