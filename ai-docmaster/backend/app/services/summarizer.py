"""
Document Summarization Service
  - Accepts raw extracted text (from PDF / OCR)
  - Returns a concise legal summary
  - Handles chunking for large documents
"""
from __future__ import annotations
from typing import Optional
from loguru import logger
from app.services.llm_client import get_llm_response

# ~3000 chars per chunk to stay within token limits
CHUNK_SIZE = 3000
CHUNK_OVERLAP = 200


def _chunk_text(text: str) -> list[str]:
    """Split long text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start = end - CHUNK_OVERLAP
    return chunks


async def summarize_document_text(text: str, doc_type: str = "legal document") -> str:
    """
    Summarize document text.
    For short texts: single LLM call.
    For long texts: chunk → summarize each → combine summaries.
    """
    text = text.strip()
    if not text:
        return "No text content to summarize."

    if len(text) <= CHUNK_SIZE:
        return await _single_summary(text, doc_type)
    else:
        return await _chunked_summary(text, doc_type)


async def _single_summary(text: str, doc_type: str) -> str:
    system = (
        "You are an expert Indian legal assistant specializing in document analysis. "
        "Create clear, concise summaries that highlight legally important information."
    )
    user = f"""Summarize the following {doc_type} in 3-5 key points. 
Focus on: parties involved, main claims/issues, important dates, legal obligations, and outcomes.

Document:
\"\"\"
{text}
\"\"\"

Format your response as:
**Document Summary**
• Point 1
• Point 2
• Point 3
...

**Key Legal Points:** (any important legal provisions or implications mentioned)
"""
    try:
        return await get_llm_response(system, user, temperature=0.2, max_tokens=600)
    except Exception as e:
        logger.error(f"[Summarizer] Error: {e}")
        # Extractive fallback: first 500 chars
        return f"[Auto-extract] {text[:500]}..."


async def _chunked_summary(text: str, doc_type: str) -> str:
    chunks = _chunk_text(text)
    logger.info(f"[Summarizer] Large document: {len(chunks)} chunks")

    # Summarize each chunk
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        system = "You are an expert legal document analyst."
        user = f"Summarize this section ({i+1}/{len(chunks)}) of a {doc_type} in 2-3 sentences:\n\n{chunk}"
        try:
            summary = await get_llm_response(system, user, temperature=0.1, max_tokens=200)
            chunk_summaries.append(summary)
        except Exception:
            chunk_summaries.append(chunk[:200] + "...")

    # Combine chunk summaries into final summary
    combined = "\n".join(chunk_summaries)
    system = "You are an expert legal summarizer."
    user = f"""Combine these section summaries of a {doc_type} into one coherent final summary:

{combined}

Provide a clear, organized 5-7 point summary covering all key aspects."""
    try:
        return await get_llm_response(system, user, temperature=0.2, max_tokens=700)
    except Exception as e:
        logger.error(f"[Summarizer] Final merge error: {e}")
        return "\n".join(chunk_summaries[:3])


async def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF with OCR fallback."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text_parts = []
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                text_parts.append(text)
            else:
                # OCR fallback for scanned pages
                text_parts.append(await _ocr_page(page))
        doc.close()
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"[Summarizer] PDF extract error: {e}")
        return ""


async def _ocr_page(page) -> str:
    """OCR a single PDF page using Tesseract."""
    try:
        import pytesseract
        from PIL import Image
        import io

        pix = page.get_pixmap(dpi=300)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        return pytesseract.image_to_string(img, lang="eng")
    except Exception as e:
        logger.warning(f"[OCR] Fallback failed: {e}")
        return ""
