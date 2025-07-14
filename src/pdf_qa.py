from src.qa_engine import answer_question

def ask_pdf_question(summary: str, question: str, target_language: str = 'en', use_gpu: bool = True) -> str:
    """Answer a question about the PDF summary using the QA model."""
    return answer_question(summary, question, target_language, use_gpu=use_gpu) 