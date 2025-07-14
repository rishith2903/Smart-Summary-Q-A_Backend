import re
from transformers.pipelines import pipeline
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from src.utils.logging_utils import setup_logger
from src.utils.error_handling import log_exceptions, SummarizerError
from typing import List, Optional

logger = setup_logger(__name__)

class TranscriptSummarizer:
    def __init__(self, use_gpu: bool = True, max_chunk_size: int = 1000, overlap: int = 100) -> None:
        self.use_gpu = use_gpu and torch.cuda.is_available()
        self.device = "cuda" if self.use_gpu else "cpu"
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
        model_name = "facebook/bart-large-cnn"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(self.device)
        self.summarizer = pipeline(
            "summarization",
            model=model_name,
            tokenizer=model_name,
            device=0 if self.use_gpu else -1
        )
        logger.info(f"Summarizer initialized on {self.device}")

    def chunk_text(self, text: str) -> List[str]:
        text = re.sub(r'\s+', ' ', text).strip()
        if len(text) <= self.max_chunk_size:
            return [text]
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.max_chunk_size
            if end < len(text):
                for i in range(end, max(start, end - 200), -1):
                    if text[i] in '.!?':
                        end = i + 1
                        break
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start = end - self.overlap
            if start >= len(text):
                break
        logger.info(f"Split transcript into {len(chunks)} chunks")
        return chunks

    def summarize_chunk(self, chunk: str) -> str:
        try:
            max_input_length = 1024
            if len(chunk) > max_input_length:
                chunk = chunk[:max_input_length]
            summary = self.summarizer(chunk, max_length=150, min_length=50, do_sample=False)[0]['summary_text']
            return summary.strip()
        except Exception as e:
            logger.warning(f"Failed to summarize chunk: {e}")
            sentences = chunk.split('.')
            return '. '.join(sentences[:3]) + '.'

    def merge_summaries(self, summaries: List[str]) -> str:
        if not summaries:
            return ""
        if len(summaries) == 1:
            return summaries[0]
        combined = " ".join(summaries)
        if len(combined) > 1000:
            return self.summarize_chunk(combined)
        return combined

@log_exceptions
def summarize_transcript(transcript: str, use_gpu: bool = True) -> str:
    logger.info("Starting transcript summarization")
    if not transcript or len(transcript.strip()) < 50:
        raise SummarizerError("Transcript is too short to summarize")
    summarizer = TranscriptSummarizer(use_gpu=use_gpu)
    chunks = summarizer.chunk_text(transcript)
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        logger.info(f"Summarizing chunk {i+1}/{len(chunks)}")
        summary = summarizer.summarize_chunk(chunk)
        chunk_summaries.append(summary)
    final_summary = summarizer.merge_summaries(chunk_summaries)
    logger.info(f"Summarization completed. Final summary length: {len(final_summary)}")
    return final_summary 