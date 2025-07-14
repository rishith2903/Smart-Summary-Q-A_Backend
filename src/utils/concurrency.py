import concurrent.futures
from typing import Callable, List, Any, Tuple

def run_concurrent_tasks(task_fn: Callable, task_args_list: List[Any], max_workers: int = 4) -> List[Tuple[Any, Any]]:
    results: List[Tuple[Any, Any]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_args = {executor.submit(task_fn, *args): args for args in task_args_list}
        for future in concurrent.futures.as_completed(future_to_args):
            args = future_to_args[future]
            try:
                result = future.result()
                results.append((args, result))
            except Exception as exc:
                results.append((args, exc))
    return results 