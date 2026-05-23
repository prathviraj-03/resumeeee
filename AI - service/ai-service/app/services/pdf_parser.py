import io
from PyPDF2 import PdfReader
from app.utils.logger import logger

async def parse_resume_file(file_bytes: bytes, filename: str) -> dict:
    """
    Parses a resume file (PDF) and extracts text content.
    Returns a dictionary with raw_text.
    """
    logger.info("pdf_parser_start", filename=filename)
    try:
        if filename.lower().endswith(".pdf"):
            text = await _parse_pdf(file_bytes)
        else:
            # Placeholder for other file types like DOCX
            raise NotImplementedError("Only PDF parsing is currently supported.")

        logger.info("pdf_parser_success", filename=filename, text_length=len(text))
        return {"raw_text": text}

    except Exception as e:
        logger.error("pdf_parser_error", filename=filename, error=str(e))
        raise ValueError(f"Failed to parse file {filename}: {e}")


async def _parse_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file's bytes."""
    try:
        with io.BytesIO(file_bytes) as pdf_file:
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
    except Exception as e:
        logger.error("pdf_parsing_failed", error=str(e))
        raise RuntimeError(f"Could not read PDF content: {e}")
