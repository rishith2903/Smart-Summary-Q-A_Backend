from src.utils.concurrency import run_concurrent_tasks
from src.transcriber import get_transcript_or_transcribe
from src.summarizer import summarize_transcript
from src.translator import translate_text, detect_language
from src.qa_engine import answer_question
from src.utils.logging_utils import setup_logger
from typing import List, Dict, Any, Tuple

logger = setup_logger(__name__)

def process_single_video(url: str, target_language: str, use_gpu: bool = True) -> Dict[str, Any]:
    logger.info(f"Processing video: {url}")
    try:
        transcript = get_transcript_or_transcribe(url, use_gpu=use_gpu)
        summary = summarize_transcript(transcript, use_gpu=use_gpu)
        translated_summary = translate_text(summary, target_language, use_gpu=use_gpu)
        return {
            'url': url,
            'transcript_snippet': transcript[:500],
            'summary': summary,
            'translated_summary': translated_summary,
            'error': None
        }
    except Exception as e:
        return {
            'url': url,
            'transcript_snippet': '',
            'summary': '',
            'translated_summary': '',
            'error': str(e)
        }

def process_videos(video_urls: List[str], target_language: str, use_gpu: bool = True, max_workers: int = 4) -> List[Tuple[Any, Dict[str, Any]]]:
    task_args_list = [(url, target_language, use_gpu) for url in video_urls]
    results = run_concurrent_tasks(process_single_video, task_args_list, max_workers=max_workers)
    return results 