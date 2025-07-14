from googletrans import Translator
from langdetect import detect
from src.utils.logging_utils import setup_logger
from src.utils.error_handling import log_exceptions, SummarizerError
from typing import Optional

logger = setup_logger(__name__)

@log_exceptions
def translate_text(text: str, target_language: str, use_gpu: bool = True) -> str:
    """
    Translate text to the target language using googletrans.
    Note: The use_gpu argument is ignored for translation.
    """
    logger.info(f"Translating text to {target_language}")
    try:
        translator = Translator()
        result = translator.translate(text, dest=target_language)
        return result.text
    except Exception as e:
        logger.warning(f"Translation failed: {e}")
        return text

@log_exceptions
def detect_language(text: str) -> Optional[str]:
    try:
        lang = detect(text)
        logger.info(f"Detected language: {lang}")
        return lang
    except Exception as e:
        logger.warning(f"Language detection failed: {e}")
        return None