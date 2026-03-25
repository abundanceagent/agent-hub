# Northstar — Project Context

## What It Is
Northstar is a Solana DEX arbitrage bot that monitors SOL/USDC prices across
Raydium, Orca, and Jupiter. When a profitable spread is detected it executes
simulated (paper) trades with strict risk guardrails.

## Tech Stack
- Python async (aiohttp, websockets, asyncio)
- Solana blockchain integration (solders, solana-py)
- FastAPI web dashboard + Rich terminal UI
- Claude Agent SDK for AI task orchestration

## Current Status
- Paper trading mode — no real funds at risk
- Price feeds: Raydium v3 API, Jupiter, Orca (stub)
- Guardrails: 0.6% min spread, $0.50 min profit, 3% daily loss circuit breaker,
  10% all-time drawdown shutdown, $500 max trade size, max 100 trades/day

## Goals
1. Prove consistent paper-trading profitability before going live
2. Expand to more Solana DEX pairs (Meteora, Phoenix, etc.)
3. Build a developer + trader community around the project
4. Open-source the bot with transparent performance reporting

## Key Files
- `main.py` — entry point, runs trading loop + web dashboard
- `config.py` — all settings (edit here)
- `src/strategy/arb_detector.py` — spread detection logic
- `src/execution/risk.py` — risk guardrails + circuit breakers
- `src/execution/paper_trader.py` — simulated trade executor
- `hub.py` — universal agent hub (this AI system)
