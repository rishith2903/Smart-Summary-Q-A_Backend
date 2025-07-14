from loguru import logger
from typing import Callable, Any

class SummarizerError(Exception):
    pass

def log_exceptions(func: Callable) -> Callable:
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Exception in {func.__name__}: {e}")
            raise SummarizerError(str(e)) from e
    return wrapper 