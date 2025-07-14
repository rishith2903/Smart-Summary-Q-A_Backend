from transformers.pipelines import pipeline
from transformers import AutoTokenizer, AutoModelForQuestionAnswering
from sentence_transformers import SentenceTransformer, util
from src.translator import translate_text, detect_language
import torch
from src.utils.logging_utils import setup_logger
from src.utils.error_handling import log_exceptions, SummarizerError
from typing import Any

logger = setup_logger(__name__)

class QAModel:
    def __init__(self, use_gpu: bool = True) -> None:
        self.use_gpu = use_gpu and torch.cuda.is_available()
        self.device = 0 if self.use_gpu else -1
        self.model_name = "distilbert-base-uncased-distilled-squad"
        self.qa_pipeline = pipeline(
            "question-answering",
            model=self.model_name,
            tokenizer=self.model_name,
            device=self.device
        )
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2', device='cuda' if self.use_gpu else 'cpu')
        logger.info(f"QA engine initialized on {'cuda' if self.use_gpu else 'cpu'}")

    def find_relevant_context(self, summary: str, question: str, top_k: int = 3) -> str:
        sentences = summary.split('.')
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_embeddings = self.embedder.encode(sentences, convert_to_tensor=True)
        question_embedding = self.embedder.encode([question], convert_to_tensor=True)[0]
        hits = util.semantic_search(question_embedding, sentence_embeddings, top_k=top_k)[0]
        relevant = ' '.join([sentences[hit['corpus_id']] for hit in hits])
        return relevant

    def answer(self, summary: str, question: str, target_language: str) -> str:
        question_lang = detect_language(question)
        if question_lang != 'en':
            question_en = translate_text(question, 'en', use_gpu=self.use_gpu)
        else:
            question_en = question
        context = self.find_relevant_context(summary, question_en)
        answer_en = self.qa_pipeline({
            'context': context,
            'question': question_en
        })['answer']
        if target_language != 'en':
            answer = translate_text(answer_en, target_language, use_gpu=self.use_gpu)
        else:
            answer = answer_en
        return answer

@log_exceptions
def answer_question(summary: str, question: str, target_language: str, use_gpu: bool = True) -> str:
    """
    Answer a question about a summary using a QA model.
    Note: This instantiates a new QAModel for each call. For repeated Q&A, reuse the QAModel instance.
    """
    logger.info(f"Answering question: {question} (target language: {target_language})")
    qa = QAModel(use_gpu=use_gpu)
    return qa.answer(summary, question, target_language) 