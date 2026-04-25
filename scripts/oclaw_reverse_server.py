#!/usr/bin/env python3
import argparse
import asyncio
import json
import signal
from datetime import datetime

import websockets


def now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(message: str) -> None:
    print(f"[{now()}] {message}", flush=True)


async def handle_connection(
    websocket,
    expected_token: str | None,
) -> None:
    request = getattr(websocket, "request", None)
    path = getattr(request, "path", None) or getattr(websocket, "path", "")
    raw_headers = getattr(request, "headers", None) or getattr(websocket, "request_headers", {})
    headers = dict(raw_headers)
    auth = headers.get("Authorization", "")

    log(f"connected path={path}")
    for key in ("Authorization", "X-Device-ID", "X-Device-Name", "X-Device-Country", "X-Remote-Device-Key"):
        if key in headers:
            log(f"header {key}={headers[key]}")

    if expected_token:
        expected_header = f"Bearer {expected_token}"
        if auth != expected_header:
            log("rejecting connection: invalid token")
            await websocket.close(code=4001, reason="Unauthorized")
            return

    try:
        async for raw_message in websocket:
            try:
                parsed = json.loads(raw_message)
                pretty = json.dumps(parsed, ensure_ascii=False)
            except Exception:
                pretty = raw_message
            log(f"recv {pretty}")
    except websockets.ConnectionClosed as exc:
        log(f"disconnected code={exc.code} reason={exc.reason}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Minimal reverse WebSocket server for OClaw / Droidrun Portal.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--token", default="")
    args = parser.parse_args()

    stop_event = asyncio.Event()

    def stop_handler(*_: object) -> None:
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_handler)

    async def connection_handler(websocket) -> None:
        await handle_connection(websocket, args.token.strip() or None)

    async with websockets.serve(connection_handler, args.host, args.port):
        masked_token = f"{args.token[:4]}...{args.token[-4:]}" if args.token else "(none)"
        log(f"reverse server listening on ws://{args.host}:{args.port}/v1/providers/personal/join token={masked_token}")
        await stop_event.wait()
        log("shutting down")


if __name__ == "__main__":
    asyncio.run(main())
