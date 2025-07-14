import os
import tempfile
from youtube_transcript_api._api import YouTubeTranscriptApi
from faster_whisper import WhisperModel
from pytube import YouTube
from src.utils.logging_utils import setup_logger
from src.utils.error_handling import log_exceptions, SummarizerError
from src.utils.media import extract_video_id, download_audio
from typing import Optional

logger = setup_logger(__name__)

@log_exceptions
def get_youtube_transcript(url: str) -> Optional[str]:
    """Try to get auto-generated transcript from YouTube."""
    try:
        video_id = extract_video_id(url)
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        full_transcript = " ".join(part['text'] for part in transcript_list)
        logger.info(f"Successfully extracted transcript for video {video_id}")
        return full_transcript.strip()
    except Exception as e:
        logger.warning(f"Could not get YouTube transcript: {e}")
        return None

@log_exceptions
def transcribe_audio(audio_path: str, use_gpu: bool = True) -> str:
    """Transcribe audio using faster-whisper with GPU acceleration if available."""
    try:
        device = "cuda" if use_gpu else "cpu"
        compute_type = "float16" if use_gpu else "int8"
        model = WhisperModel("base", device=device, compute_type=compute_type)
        segments, info = model.transcribe(audio_path, beam_size=5)
        transcript = " ".join(segment.text for segment in segments)
        logger.info(f"Transcription completed. Language: {info.language}")
        return transcript.strip()
    except Exception as e:
        raise SummarizerError(f"Failed to transcribe audio: {e}")

@log_exceptions
def get_transcript_or_transcribe(url: str, use_gpu: bool = True) -> str:
    """Main function: try to get YouTube transcript, fallback to audio transcription."""
    logger.info(f"Processing transcript for: {url}")
    transcript = get_youtube_transcript(url)
    if transcript and len(transcript) > 100:
        logger.info("Using YouTube auto-generated transcript")
        return transcript
    logger.info("YouTube transcript not available, downloading audio for transcription")
    with tempfile.TemporaryDirectory() as temp_dir:
        audio_path = download_audio(url, temp_dir)
        transcript = transcribe_audio(audio_path, use_gpu=use_gpu)
        if os.path.exists(audio_path):
            os.remove(audio_path)
    return transcript 