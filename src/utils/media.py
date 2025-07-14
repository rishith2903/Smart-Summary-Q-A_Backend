import os
from pytube import YouTube
from typing import Optional
from src.utils.error_handling import SummarizerError, log_exceptions

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from URL."""
    try:
        if 'youtube.com/watch?v=' in url:
            return url.split('watch?v=')[1].split('&')[0]
        elif 'youtu.be/' in url:
            return url.split('youtu.be/')[1].split('?')[0]
        else:
            raise ValueError("Invalid YouTube URL")
    except Exception as e:
        raise SummarizerError(f"Could not extract video ID from URL: {e}")

@log_exceptions
def download_audio(url: str, output_path: str) -> str:
    """Download audio from YouTube video using pytube."""
    try:
        yt = YouTube(url)
        audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        if not audio_stream:
            raise SummarizerError("No audio stream found for this video")
        filename = f"audio_{yt.video_id}.mp4"
        file_path = audio_stream.download(output_path=output_path, filename=filename)
        return file_path
    except Exception as e:
        raise SummarizerError(f"Failed to download audio from {url}: {e}") 