# ClawGPT

> **A free, self-hosted ChatGPT alternative** — Clean web interface for [OpenClaw](https://github.com/openclaw/openclaw)

![ClawGPT Screenshot](screenshot.png)

**ClawGPT** gives you a familiar ChatGPT-like experience for your local AI. No cloud, no subscription, no data leaving your machine.

## ✨ Features

- [x] **Chat history** — Saved locally, never leaves your browser
- [x] **Multiple conversations** — Sidebar with all your chats
- [x] **Streaming responses** — See answers as they're generated
- [x] **Stop generation** — Red stop button to halt mid-response
- [x] **Dark/Light mode** — Easy on the eyes
- [x] **Mobile friendly** — Responsive design
- [x] **Zero dependencies** — No npm, no build tools, just HTML/CSS/JS

### Coming Soon

- [ ] Pin favorite chats
- [ ] Search chat history
- [ ] Rename chats
- [ ] Copy button for messages
- [ ] Edit previous messages
- [ ] Regenerate responses

## 🚀 Quick Start

**1. Start OpenClaw** ([install guide](https://docs.openclaw.ai))

**2. Get ClawGPT**
```bash
git clone https://github.com/craihub/clawgpt.git
cd clawgpt
```

**3. Serve it**
```bash
python3 -m http.server 8080
```

**4. Open in browser**
```
http://localhost:8080?token=YOUR_GATEWAY_TOKEN
```

The token auto-saves and disappears from the URL. After first visit, just use `http://localhost:8080`.

## ⚙️ Configuration

Click the **Settings** button (gear icon) to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Gateway URL | OpenClaw WebSocket endpoint | `ws://localhost:18789` |
| Auth Token | Gateway authentication token | (from URL or manual) |
| Session Key | OpenClaw session to use | `main` |
| Dark Mode | Toggle dark/light theme | On |

## 🔧 How It Works

ClawGPT connects directly to OpenClaw's Gateway WebSocket API:

1. Establishes WebSocket connection to your local gateway
2. Authenticates with your token
3. Sends messages via `chat.send`
4. Receives streaming responses via `chat` events
5. Stores chat history in browser localStorage

**No server needed** — It's pure client-side JavaScript.

## 📁 Files

```
clawgpt/
├── index.html   # Main HTML structure
├── style.css    # ChatGPT-like styling
├── app.js       # WebSocket + UI logic
└── README.md
```

## 🔍 Why ClawGPT?

| | ChatGPT | ClawGPT |
|---|---------|---------|
| **Cost** | $20/month | Free |
| **Privacy** | Data sent to OpenAI | Stays on your machine |
| **Internet** | Required | Works offline |
| **Model choice** | GPT-4 only | Any model via OpenClaw |
| **Customization** | Limited | Full control |

## 🛠️ Troubleshooting

**Can't connect?**
- Make sure OpenClaw gateway is running (`openclaw gateway status`)
- Check the Gateway URL (default port is 18789)
- Verify your auth token

**Messages not sending?**
- Check browser console (F12) for errors
- Status should show "Connected" (green)

**Chat history missing?**
- History is in browser localStorage
- Different browsers/profiles have separate storage
- Try: Settings → Connect

## 🤝 Contributing

PRs welcome! Check the "Coming Soon" list above for ideas.

## 📄 License

MIT — do whatever you want with it.

---

**Keywords:** ChatGPT alternative, self-hosted AI chat, local LLM interface, OpenClaw UI, free ChatGPT, private AI assistant, open source ChatGPT clone, web UI for local AI
