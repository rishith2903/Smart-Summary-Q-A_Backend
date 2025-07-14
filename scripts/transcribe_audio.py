#!/usr/bin/env python3
"""
TIER 2: Whisper AI Transcription Script
Transcribes audio files using faster-whisper
"""

import sys
import os
import json
from faster_whisper import WhisperModel
import torch

def transcribe_audio(audio_path, use_gpu=True, model_size="base"):
    """
    Transcribe audio file using Whisper AI
    
    Args:
        audio_path (str): Path to audio file
        use_gpu (bool): Whether to use GPU acceleration
        model_size (str): Whisper model size (tiny, base, small, medium, large)
    
    Returns:
        str: Transcribed text
    """
    try:
        # Check if audio file exists
        if not os.path.exists(audio_path):
            raise Exception(f"Audio file not found: {audio_path}")
        
        # Configure device and compute type
        device = "cpu"  # Force CPU for compatibility
        compute_type = "int8"

        print(f"Using device: {device}, compute_type: {compute_type}", file=sys.stderr)

        # Load Whisper model with error handling
        try:
            model = WhisperModel(model_size, device=device, compute_type=compute_type)
        except Exception as model_error:
            # Fallback to basic model
            print(f"Model loading failed, trying basic setup: {model_error}", file=sys.stderr)
            model = WhisperModel("tiny", device="cpu", compute_type="int8")
        
        # Transcribe audio
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            language=None,  # Auto-detect language
            task="transcribe"
        )
        
        # Combine all segments
        transcript_parts = []
        for segment in segments:
            transcript_parts.append(segment.text)
        
        transcript = " ".join(transcript_parts).strip()
        
        if not transcript:
            raise Exception("Whisper produced empty transcript")
        
        return transcript
        
    except Exception as e:
        raise Exception(f"Whisper transcription failed: {str(e)}")

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python transcribe_audio.py <audio_path> [use_gpu] [model_size]")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    use_gpu = sys.argv[2].lower() == 'true' if len(sys.argv) > 2 else True
    model_size = sys.argv[3] if len(sys.argv) > 3 else "base"
    
    try:
        transcript = transcribe_audio(audio_path, use_gpu, model_size)
        print(json.dumps({
            "success": True,
            "transcript": transcript,
            "length": len(transcript),
            "message": f"Transcription completed successfully ({len(transcript)} characters)"
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
