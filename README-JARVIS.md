# Jarvis UI

A Jarvis-themed OpenClaw interface based on [ClawGPT](https://github.com/craihub/clawgpt), with KPI dashboard and Age of Ultron aesthetic.

## What's Changed

- **Fixed OpenClaw WebSocket protocol compatibility** - Added required `platform`, `mode`, `caps`, `commands`, and `permissions` fields to all connect requests
- **Planned:** Jarvis (Age of Ultron) visual theme with holographic blue UI
- **Planned:** KPI dashboard panels for system health, cost tracking, sessions, and token usage

## Status

🚧 **Work in Progress** - Currently fixing protocol issues and preparing for UI reskin.

Based on the excellent [ClawGPT](https://github.com/craihub/clawgpt) by craihub - check out the original for a production-ready ChatGPT-style interface for OpenClaw.

## Quick Start

```bash
cd /Users/buzz/.openclaw/workspace/clawgpt
python3 -m http.server 8080
```

Open `http://localhost:8080` and enter your OpenClaw gateway token.

## License

MIT (inherited from ClawGPT)
