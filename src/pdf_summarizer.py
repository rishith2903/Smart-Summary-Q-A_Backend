import sys
import os
import hashlib
import fitz  # PyMuPDF
from typing import Dict, Optional
from src.summarizer import summarize_transcript
from src.pdf_qa import ask_pdf_question
from rich.console import Console
from rich.prompt import Prompt

console = Console()

# In-memory cache for summaries
summary_cache: Dict[str, str] = {}

def hash_file(filepath: str) -> str:
    """Return a hash of the file contents for caching."""
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def extract_text_from_pdf(filepath: str) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    try:
        doc = fitz.open(filepath)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception as e:
        raise RuntimeError(f"Failed to extract text from PDF: {e}")

def summarize_pdf(filepath: str, use_gpu: bool = True) -> str:
    """Extract text from PDF, summarize it, and cache the result."""
    file_hash = hash_file(filepath)
    if file_hash in summary_cache:
        return summary_cache[file_hash]
    text = extract_text_from_pdf(filepath)
    if not text or len(text.strip()) < 50:
        raise ValueError("PDF does not contain enough text to summarize.")
    summary = summarize_transcript(text, use_gpu=use_gpu)
    summary_cache[file_hash] = summary
    return summary

def cli():
    console.print("[bold blue]PDF Summarizer + Q&A[/bold blue]")
    pdf_path = Prompt.ask("Enter path to PDF file")
    if not os.path.isfile(pdf_path):
        console.print(f"[red]File not found:[/red] {pdf_path}")
        sys.exit(1)
    try:
        summary = summarize_pdf(pdf_path)
        console.print("[green]Summary:[/green]")
        console.print(summary)
        # Start Q&A loop
        while True:
            question = Prompt.ask("[bold yellow]Ask a question about the PDF (or type 'exit'):[/bold yellow]")
            if question.strip().lower() in ['exit', 'quit', 'q']:
                break
            answer = ask_pdf_question(summary, question)
            console.print(f"[bold green]Answer:[/bold green] {answer}")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")

if __name__ == "__main__":
    cli() 