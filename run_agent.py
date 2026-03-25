"""Shortcut entry point — delegates to hub.py."""
import anyio
from hub import main

if __name__ == "__main__":
    anyio.run(main)
