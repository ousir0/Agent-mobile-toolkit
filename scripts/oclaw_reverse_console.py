#!/usr/bin/env python3
import argparse
import asyncio
import base64
import json
import signal
import sys
import uuid
from datetime import datetime
from pathlib import Path

import websockets


def now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(message: str) -> None:
    print(f"[{now()}] {message}", flush=True)


class ReverseConsole:
    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir
        self.connection = None
        self.pending: dict[str, asyncio.Future] = {}
        self.stop_event = asyncio.Event()

    async def handle_connection(self, websocket) -> None:
        request = getattr(websocket, "request", None)
        path = getattr(request, "path", None) or getattr(websocket, "path", "")
        headers = dict(getattr(request, "headers", None) or getattr(websocket, "request_headers", {}))
        log(f"device connected path={path}")
        for key in ("X-Device-ID", "X-Device-Name", "X-Device-Country", "Authorization"):
            if key in headers:
                log(f"{key}={headers[key]}")
        self.connection = websocket
        try:
            async for raw in websocket:
                await self.on_message(raw)
        except websockets.ConnectionClosed as exc:
            log(f"device disconnected code={exc.code} reason={exc.reason}")
        finally:
            self.connection = None
            for future in self.pending.values():
                if not future.done():
                    future.set_exception(RuntimeError("connection closed"))
            self.pending.clear()

    async def on_message(self, raw) -> None:
        if isinstance(raw, bytes):
            log(f"binary message length={len(raw)}")
            return
        try:
            payload = json.loads(raw)
        except Exception:
            log(f"raw {raw}")
            return

        message_id = payload.get("id")
        if message_id and message_id in self.pending:
            future = self.pending.pop(message_id)
            if not future.done():
                future.set_result(payload)
            return

        log(f"push {json.dumps(payload, ensure_ascii=False)[:800]}")

    async def send_rpc(self, method: str, params: dict | None = None) -> dict:
        if self.connection is None:
            raise RuntimeError("device not connected")
        request_id = str(uuid.uuid4())
        future = asyncio.get_running_loop().create_future()
        self.pending[request_id] = future
        message = {
            "id": request_id,
            "method": method,
            "params": params or {},
        }
        await self.connection.send(json.dumps(message, ensure_ascii=False))
        return await asyncio.wait_for(future, timeout=30)

    async def execute(self, line: str) -> None:
        parts = line.strip().split()
        if not parts:
            return
        cmd = parts[0]

        if cmd in {"quit", "exit"}:
            self.stop_event.set()
            return

        if cmd == "help":
            print(
                "commands: app <package> | state | screenshot [name] | tap <x> <y> | "
                "input <text> | key <code> | global <actionId> | raw <json> | quit",
                flush=True,
            )
            return

        if cmd == "app":
            package = parts[1]
            response = await self.send_rpc("app", {"package": package})
            log(json.dumps(response, ensure_ascii=False))
            return

        if cmd == "state":
            response = await self.send_rpc("state", {"filter": False})
            result = response.get("result")
            output_path = self.output_dir / "latest-state.json"
            output_path.write_text(
                json.dumps(result, ensure_ascii=False, indent=2) if not isinstance(result, str) else result,
                encoding="utf-8",
            )
            log(f"saved state -> {output_path}")
            return

        if cmd == "screenshot":
            name = parts[1] if len(parts) > 1 else "latest-screenshot.png"
            response = await self.send_rpc("screenshot", {"hideOverlay": True})
            result = response.get("result")
            if not isinstance(result, str):
                raise RuntimeError(f"unexpected screenshot result: {type(result)}")
            data = base64.b64decode(result)
            output_path = self.output_dir / name
            output_path.write_bytes(data)
            log(f"saved screenshot -> {output_path}")
            return

        if cmd == "tap":
            x = int(parts[1])
            y = int(parts[2])
            response = await self.send_rpc("tap", {"x": x, "y": y})
            log(json.dumps(response, ensure_ascii=False))
            return

        if cmd == "input":
            text = line.split(" ", 1)[1]
            response = await self.send_rpc(
                "keyboard/input",
                {"base64_text": base64.b64encode(text.encode("utf-8")).decode("ascii"), "clear": True},
            )
            log(json.dumps(response, ensure_ascii=False))
            return

        if cmd == "key":
            key_code = int(parts[1])
            response = await self.send_rpc("keyboard/key", {"key_code": key_code})
            log(json.dumps(response, ensure_ascii=False))
            return

        if cmd == "global":
            action_id = int(parts[1])
            response = await self.send_rpc("global", {"action": action_id})
            log(json.dumps(response, ensure_ascii=False))
            return

        if cmd == "raw":
            raw_json = line.split(" ", 1)[1]
            payload = json.loads(raw_json)
            response = await self.send_rpc(payload["method"], payload.get("params", {}))
            log(json.dumps(response, ensure_ascii=False))
            return

        raise RuntimeError(f"unknown command: {cmd}")

    async def repl(self) -> None:
        loop = asyncio.get_running_loop()
        while not self.stop_event.is_set():
            line = await loop.run_in_executor(None, sys.stdin.readline)
            if not line:
                self.stop_event.set()
                return
            try:
                await self.execute(line)
            except Exception as exc:
                log(f"command failed: {exc}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Interactive reverse console for OClaw / Droidrun Portal.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument(
        "--output-dir",
        default="/Users/ouwei/droidrun-portal/tmp/reverse-console",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    console = ReverseConsole(output_dir=output_dir)

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, console.stop_event.set)

    async with websockets.serve(console.handle_connection, args.host, args.port):
        log(f"reverse console listening on ws://{args.host}:{args.port}/v1/providers/personal/join")
        log("type `help` for commands")
        await console.repl()
        log("shutting down")


if __name__ == "__main__":
    asyncio.run(main())
