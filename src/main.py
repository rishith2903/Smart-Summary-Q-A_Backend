import sys
from src.batch_processor import process_videos
from src.qa_engine import answer_question
from src.utils.logging_utils import setup_logger
from src.utils.error_handling import SummarizerError
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table
from typing import List, Tuple, Any

logger = setup_logger(__name__)
console = Console()

MAX_VIDEOS = 20

def get_user_inputs() -> Tuple[List[str], str, bool]:
    urls: List[str] = []
    while True:
        url = Prompt.ask("[bold blue]Enter YouTube video URL (or just press Enter to finish)[/bold blue]")
        if not url.strip():
            break
        urls.append(url.strip())
        if len(urls) >= MAX_VIDEOS:
            break
    if not urls:
        console.print("[red]No URLs provided. Exiting.[/red]")
        sys.exit(1)
    language = "auto"  # Always use auto-detect
    use_gpu = False    # Default to CPU for compatibility
    return urls, language, use_gpu

def display_summary(result: dict, idx: int) -> None:
    table = Table(title=f"Video {idx+1}: {result['url']}")
    table.add_column("Transcript Snippet", style="cyan")
    table.add_column("Summary", style="green")
    table.add_row(result['transcript_snippet'][:500] + '...', result['translated_summary'])
    console.print(table)

def interactive_qa_loop(summary: str, target_language: str, use_gpu: bool) -> None:
    console.print("[bold yellow]Enter your questions about this podcast (type 'exit' to move to next video):[/bold yellow]")
    while True:
        question = Prompt.ask("[bold blue]Your question[/bold blue]")
        if question.strip().lower() in ['exit', 'quit', 'q']:
            break
        try:
            answer = answer_question(summary, question, target_language, use_gpu=use_gpu)
            console.print(f"[bold green]Answer:[/bold green] {answer}")
        except Exception as e:
            console.print(f"[red]Error answering question: {e}[/red]")

def main() -> None:
    video_urls, target_language, use_gpu = get_user_inputs()
    console.print(f"[bold]Processing {len(video_urls)} video(s) with target language: {target_language}[/bold]")
    try:
        from src.translator import detect_language
        results = process_videos(video_urls, target_language, use_gpu=use_gpu, max_workers=min(4, len(video_urls)))
        for idx, (task_args, result) in enumerate(results):
            if isinstance(result, Exception):
                console.print(f"[red]Error processing video {task_args[0]}: {result}[/red]")
                continue
            lang_for_this_video = target_language
            if target_language.lower() == "auto":
                detected_lang = detect_language(result['summary'])
                if detected_lang:
                    lang_for_this_video = detected_lang
                    console.print(f"[yellow]Auto-detected language: {lang_for_this_video}[/yellow]")
                    if detected_lang != 'en':
                        from src.translator import translate_text
                        result['translated_summary'] = translate_text(result['summary'], detected_lang, use_gpu)
                else:
                    console.print("[red]Could not auto-detect language, defaulting to English.[/red]")
                    lang_for_this_video = "en"
            display_summary(result, idx)
            interactive_qa_loop(result['summary'], lang_for_this_video, use_gpu)
    except SummarizerError as e:
        console.print(f"[red]Summarization error: {e}[/red]")
    except Exception as e:
        console.print(f"[red]Unexpected error: {e}[/red]")

if __name__ == "__main__":
    main() 