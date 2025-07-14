#!/usr/bin/env python3
"""
TIER 3: pytube Audio Download Script (Fallback)
Downloads audio from YouTube videos using pytube
"""

import sys
import os
import tempfile
import json
from pathlib import Path
from pytube import YouTube

def download_audio_pytube(url, output_dir=None):
    """
    Download audio from YouTube video using pytube (fallback method)
    
    Args:
        url (str): YouTube video URL
        output_dir (str): Output directory (optional)
    
    Returns:
        str: Path to downloaded audio file
    """
    try:
        # Create output directory if not provided
        if output_dir is None:
            output_dir = tempfile.mkdtemp()
        
        # Ensure output directory exists
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Create YouTube object
        yt = YouTube(url)
        
        # Get the best audio stream
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            raise Exception("No audio stream available for this video")
        
        # Generate filename
        safe_title = "".join(c for c in yt.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"pytube_audio_{safe_title[:50]}.mp4"
        audio_path = os.path.join(output_dir, filename)
        
        # Download audio
        audio_stream.download(output_path=output_dir, filename=filename)
        
        if not os.path.exists(audio_path):
            raise Exception("Downloaded audio file not found")
        
        return audio_path
        
    except Exception as e:
        raise Exception(f"pytube audio download failed: {str(e)}")

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print("Usage: python pytube_download.py <youtube_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    
    try:
        audio_path = download_audio_pytube(url)
        print(json.dumps({
            "success": True,
            "audio_path": audio_path,
            "message": f"Audio downloaded successfully to {audio_path}"
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
