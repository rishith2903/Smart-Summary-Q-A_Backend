#!/usr/bin/env python3
"""
TIER 2: yt-dlp Audio Download Script
Downloads audio from YouTube videos using yt-dlp
"""

import sys
import os
import tempfile
import yt_dlp
import json
from pathlib import Path

def download_audio(url, output_dir=None):
    """
    Download audio from YouTube video using yt-dlp
    
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
        
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'bestaudio/best',
            'extractaudio': True,
            'audioformat': 'mp3',
            'audioquality': '0',  # Best quality
            'outtmpl': os.path.join(output_dir, 'audio.%(ext)s'),
            'noplaylist': True,
            'ignoreerrors': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        # Download audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first to get the final filename
            info = ydl.extract_info(url, download=False)
            if not info:
                raise Exception("Could not extract video information")
            
            # Download the audio
            ydl.download([url])
            
            # Find the downloaded file
            for file in os.listdir(output_dir):
                if file.startswith('audio.'):
                    audio_path = os.path.join(output_dir, file)
                    return audio_path
            
            raise Exception("Downloaded audio file not found")
            
    except Exception as e:
        raise Exception(f"yt-dlp audio download failed: {str(e)}")

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print("Usage: python download_audio.py <youtube_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    
    try:
        audio_path = download_audio(url)
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
