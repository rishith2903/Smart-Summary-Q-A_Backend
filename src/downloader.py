import os
from pytube import YouTube
from src.utils.media import download_audio
from src.utils.logging_utils import setup_logger
from src.utils.error_handling import log_exceptions, SummarizerError
from typing import Dict

logger = setup_logger(__name__)

@log_exceptions
def get_video_info(url: str) -> Dict[str, str]:
    """Get basic video information."""
    try:
        yt = YouTube(url)
        return {
            'title': yt.title,
            'duration': yt.length,
            'author': yt.author,
            'video_id': yt.video_id
        }
    except Exception as e:
        raise SummarizerError(f"Failed to get video info: {e}")

@log_exceptions
def validate_youtube_url(url: str) -> bool:
    """Validate if the URL is a valid YouTube URL."""
    try:
        yt = YouTube(url)
        _ = yt.title
        return True
    except Exception:
        return False 