# Deploying Jarvis UI to Vercel

This guide walks you through deploying Jarvis UI to Vercel for cloud access from anywhere.

## Prerequisites

- A GitHub account
- A Vercel account (free tier works - sign up at [vercel.com](https://vercel.com))
- OpenClaw running on your desktop/server
- Basic familiarity with git

## Quick Start

### 1. Push to GitHub

If you haven't already, push your Jarvis UI project to GitHub:

```bash
cd ~/jarvis-ui
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from your project directory
cd ~/jarvis-ui
vercel

# Follow the prompts:
# - Link to existing project? No
# - What's your project's name? jarvis-ui (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? No
```

The CLI will output your deployment URL, e.g., `https://jarvis-ui-xyz.vercel.app`

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository (`jarvis-ui`)
4. Configure (most should be auto-detected):
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** (leave empty - no build needed)
   - **Output Directory:** `./`
5. Click "Deploy"

### 3. Configure OpenClaw CORS

After deployment, you need to allow your Vercel domain in OpenClaw:

```bash
# Replace with your actual Vercel URL
openclaw config set gateway.controlUi.allowedOrigins '["https://jarvis-ui-xyz.vercel.app"]'

# Restart the gateway to apply changes
openclaw gateway restart
```

**That's it!** Your Jarvis UI is now accessible from anywhere.

---

## Using Your Deployed App

The deployed version uses **Relay Mode** exclusively for secure remote access.

### Desktop → Phone Connection Flow

#### Step 1: Set up Desktop (Host)

1. On your desktop where OpenClaw runs, open ClawGPT locally:
   ```
   http://localhost:8080
   ```

2. Click the **Settings** button (gear icon)

3. Scroll to **"Mobile Access"**

4. Enable **"Remote Access (works from anywhere)"** toggle

5. Click **"Show QR Code"**

You'll see:
- A QR code
- Room ID (e.g., `cg-abc123def456`)
- Status: "Waiting for phone to connect..."
- Relay URL: `wss://clawgpt-relay.fly.dev`

#### Step 2: Connect from Phone

**Option A: Scan QR Code (Easiest)**

1. On your phone, visit your Vercel URL:
   ```
   https://jarvis-ui-xyz.vercel.app
   ```

2. Use your phone's camera app to scan the QR code

3. Tap the notification/link that appears

4. Your phone will open Jarvis UI with the relay connection params

**Option B: Manual Connection**

1. On your phone, visit your Vercel URL
2. The app will show "Welcome! This is a cloud deployment"
3. Follow the on-screen instructions to connect via relay

#### Step 3: Verify Connection

Both devices should show:
- **Verification words**: Three matching words (e.g., "apple banana cherry")
- **Status**: "Connected via relay"
- **Encryption**: "End-to-end encrypted ✓"

**IMPORTANT:** If the verification words don't match, disconnect immediately. This could indicate a man-in-the-middle attack.

---

## How Relay Mode Works

```
┌─────────────┐                      ┌─────────────────────┐                      ┌─────────────┐
│   Phone     │◄────encrypted────────►│   Relay Server      │◄────encrypted────────►│   Desktop   │
│  (Vercel)   │    XSalsa20-Poly1305  │  (fly.dev)          │    XSalsa20-Poly1305  │  (Local)    │
└─────────────┘                      └─────────────────────┘                      └─────────────┘
                                             ▲
                                             │
                                        Sees only
                                     encrypted blobs
                                   (zero-knowledge)
```

### Security Features

- **End-to-End Encryption**: XSalsa20-Poly1305 authenticated encryption
- **Zero-Knowledge Relay**: Relay server never sees your plaintext messages
- **Perfect Forward Secrecy**: New encryption keys generated for each session
- **Visual Verification**: Matching words confirm no MITM attack
- **No Token Exposure**: Your auth token never goes through the relay

### Relay Server

**Default relay:** `wss://clawgpt-relay.fly.dev`

This is a public relay server provided by the ClawGPT project. It's zero-knowledge by design - it only routes encrypted messages and cannot decrypt them.

**Don't trust the public relay?** You can [self-host your own](https://github.com/craihub/clawgpt-relay).

---

## Environment-Specific Behavior

| Feature | Localhost | Vercel Deployment |
|---------|-----------|-------------------|
| **Direct Gateway** | ✅ Default | ❌ Not possible |
| **Relay Mode** | ✅ Optional | ✅ Required |
| **config.js** | ✅ Used | ❌ Not deployed (gitignored) |
| **URL Params** | ✅ Works | ✅ Works |
| **localStorage** | ✅ Used | ✅ Used |

The app automatically detects the environment and switches to relay-only mode when deployed.

---

## Troubleshooting

### "Origin not allowed" Error

**Symptom:** Cannot connect, see error message about origin not allowed

**Cause:** Your Vercel domain isn't in OpenClaw's allowed origins list

**Fix:**
```bash
# Add your Vercel domain
openclaw config set gateway.controlUi.allowedOrigins '["https://your-app.vercel.app"]'

# Restart gateway
openclaw gateway restart

# Reload the page in your browser
```

### QR Code Doesn't Work

**Symptom:** Scanning QR shows nothing or wrong URL

**Possible causes:**
1. Desktop ClawGPT not running on localhost:8080
2. Relay mode not enabled in desktop settings
3. QR scanner not working

**Fix:**
1. Make sure desktop ClawGPT is running at `http://localhost:8080`
2. Check that "Remote Access" toggle is enabled
3. Try using your phone's native camera app (not a third-party QR app)
4. If QR scanning fails, use manual connection via Settings

### Can't Connect via Relay

**Symptom:** "Connecting to relay..." never completes

**Possible causes:**
1. Firewall blocking WebSocket connections
2. Relay server temporarily down
3. Desktop not connected to relay
4. Network restrictions (corporate/school WiFi)

**Fix:**

1. **Test relay server availability:**
   ```bash
   curl -I https://clawgpt-relay.fly.dev
   # Should return HTTP 200
   ```

2. **Check desktop connection:**
   - On desktop, check Settings → Mobile Access
   - Should show "Waiting for phone to connect..."
   - If it says "Connecting...", wait or refresh

3. **Try a different network:**
   - Some corporate/school networks block WebSocket connections
   - Try using mobile data or a different WiFi network

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Look for WebSocket errors
   - Share errors if asking for help

### Verification Words Don't Match

**Symptom:** Desktop shows "apple banana" but phone shows "dog cat"

**⚠️ This is a security issue!** Someone might be intercepting your connection.

**Fix:**
1. **Disconnect immediately** - Close the connection on both devices
2. **Clear browser cache** on both desktop and phone
3. **Generate a new QR code** - Desktop: Settings → Show QR Code (new room)
4. **Try again on a trusted network** - Avoid public WiFi
5. **If it persists**, consider self-hosting your own relay server

### Chat History Not Syncing

**Symptom:** Messages sent on phone don't appear on desktop

**Note:** Relay mode provides real-time communication, but chat history syncs only while both devices are connected.

**How sync works:**
- ✅ Real-time messaging while connected
- ✅ Initial chat list sync when phone connects
- ❌ No persistent cloud storage
- ❌ No sync when disconnected

**Expected behavior:**
- Messages sent from phone → appear on desktop immediately (while connected)
- Chat history is stored locally on each device (IndexedDB)
- For persistent cross-device sync, use the file-based memory storage feature

### Production Setup Wizard Loops

**Symptom:** Setup wizard shows production instructions but I'm on localhost

**Cause:** The app thinks it's in production mode

**Fix:**
1. Check `window.location.hostname` in browser console
2. Make sure you're accessing via `localhost` or `127.0.0.1`
3. If using a custom domain locally, update `config.production.js` line 7

### Desktop Shows Relay Required But I Want Direct Gateway

**Symptom:** Settings shows "REQUIRED" badge on relay toggle, can't use direct gateway

**Cause:** You're accessing the deployed Vercel version, not localhost

**Explanation:** Direct gateway connections don't work from Vercel (cloud deployment). You must use relay mode.

**Solution:**
- Use localhost for direct gateway access: `http://localhost:8080`
- Use Vercel deployment for remote access via relay

---

## Custom Domain

Want to use your own domain instead of `*.vercel.app`?

### 1. Add Domain in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain (e.g., `jarvis.yourdomain.com`)
4. Follow the DNS configuration instructions

Vercel will provide you with DNS records to add:
- For apex domains (`yourdomain.com`): Add A record
- For subdomains (`jarvis.yourdomain.com`): Add CNAME record

### 2. Update DNS

In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):
- Add the DNS records provided by Vercel
- Wait for DNS propagation (can take up to 48 hours, usually 5-10 minutes)

### 3. Update OpenClaw CORS

```bash
openclaw config set gateway.controlUi.allowedOrigins '["https://jarvis.yourdomain.com"]'
openclaw gateway restart
```

### 4. SSL Certificate

Vercel automatically provisions SSL certificates for custom domains. No configuration needed!

---

## Self-Hosting the Relay Server

Don't trust the public relay? Host your own!

### 1. Clone the Relay Server

```bash
git clone https://github.com/craihub/clawgpt-relay.git
cd clawgpt-relay
```

### 2. Deploy to a Hosting Provider

**Option A: Fly.io (Recommended)**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

**Option B: Railway**

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Import your repo
4. Deploy

**Option C: Any Node.js Host**

- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run

### 3. Update config.production.js

Edit `/Users/buzz/jarvis-ui/config.production.js`:

```javascript
relayServer: 'wss://your-relay.yourdomain.com',
```

### 4. Redeploy Jarvis UI

```bash
git add config.production.js
git commit -m "Use self-hosted relay server"
git push origin main

# Vercel will auto-deploy if connected to GitHub
# Or manually redeploy:
vercel --prod
```

---

## Production vs Development

The app automatically detects the environment and adapts:

### Production Mode (Vercel)
- ✅ Relay mode required
- ❌ No direct gateway connections
- ✅ Setup wizard shows relay instructions
- ✅ Gateway URL input disabled in settings
- ✅ "REQUIRED" badge on relay toggle

### Development Mode (localhost)
- ✅ Direct gateway default
- ✅ Relay mode optional
- ✅ Normal setup wizard
- ✅ All configuration options available
- ✅ Full manual control

**Detection logic:** If `window.location.hostname` is not `localhost` or `127.0.0.1`, production mode is enabled.

---

## Security Best Practices

1. **Never commit config.js** - It contains your auth token. Already gitignored.

2. **Don't share QR codes** - They contain connection credentials for relay access.

3. **Always verify the words** - Check that verification words match on both devices before trusting the connection.

4. **Use HTTPS** - Vercel provides this automatically. Never disable it.

5. **Review CORS origins** - Only allow domains you control:
   ```bash
   openclaw config get gateway.controlUi.allowedOrigins
   ```

6. **Self-host relay if paranoid** - While the public relay is zero-knowledge, you can host your own for full control.

7. **Monitor OpenClaw logs** - Check for unusual connection attempts:
   ```bash
   openclaw gateway logs
   ```

---

## Updating Your Deployment

### Automatic (Recommended)

If you connected your GitHub repo to Vercel:

```bash
# Make changes locally
git add .
git commit -m "Update feature X"
git push origin main

# Vercel automatically deploys on push
```

### Manual

```bash
# From your project directory
vercel --prod
```

---

## Cost

- **Vercel Free Tier**: Sufficient for personal use
  - 100GB bandwidth/month
  - 100GB-hours serverless function execution
  - Unlimited deployments
  - Automatic HTTPS

- **Relay Server**:
  - Public relay: Free (provided by ClawGPT)
  - Self-hosted: Free on Fly.io free tier

- **OpenClaw**: Runs on your machine, uses your Claude.ai subscription

**Total deployment cost: $0**

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Internet                              │
│                                                               │
│  ┌───────────────┐         ┌──────────────────┐             │
│  │   Phone       │────────►│  Vercel CDN      │             │
│  │  (anywhere)   │  HTTPS  │  jarvis-ui.app   │             │
│  └───────────────┘         └──────────────────┘             │
│         │                           │                         │
│         │                           │ Serves HTML/CSS/JS      │
│         │ WSS (encrypted)           ▼                         │
│         │                  ┌─────────────────┐               │
│         └─────────────────►│  Relay Server   │               │
│                            │   (fly.dev)     │               │
│                            │ Zero-knowledge  │               │
│                            └────────┬────────┘               │
│                                     │                         │
│                                     │ WSS (encrypted)         │
└─────────────────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                               ┌──────────────────┐
                               │  Your Desktop    │
                               │  - OpenClaw      │
                               │    Gateway       │
                               │  - ClawGPT       │
                               │    (localhost)   │
                               │  - Has auth      │
                               │    token         │
                               └──────────────────┘
```

---

## Monitoring & Logs

### Vercel Logs

View deployment and runtime logs:

```bash
# Recent logs
vercel logs

# Follow logs in real-time
vercel logs --follow
```

Or via dashboard:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Logs" tab

### OpenClaw Gateway Logs

Monitor connections and errors:

```bash
# View recent logs
openclaw gateway logs

# Follow in real-time
openclaw gateway logs --follow
```

---

## FAQ

### Can I use this without Vercel?

Yes! You can deploy to any static hosting provider:
- **Netlify**: Similar to Vercel, drag-and-drop deployment
- **GitHub Pages**: Free, built into GitHub
- **Cloudflare Pages**: Free with excellent global CDN
- **AWS S3 + CloudFront**: Scalable but more complex setup

The key requirement: Must serve static files over HTTPS.

### Does this work on iOS?

Yes! While there's no native iOS app yet, you can:
1. Visit your Vercel URL in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. This creates a PWA-like experience

QR scanning works via the native camera app.

### Can multiple devices connect simultaneously?

**Current limitation:** One phone per desktop relay connection.

**Workaround:** Generate separate QR codes for different phones:
1. Each device gets its own relay room
2. Or use the same relay URL but connect sequentially

### Is the relay server open source?

Yes! [github.com/craihub/clawgpt-relay](https://github.com/craihub/clawgpt-relay)

You can:
- Audit the code
- Self-host your own instance
- Submit improvements via PR

### What data does the relay server store?

**None.** The relay server:
- ✅ Routes encrypted WebSocket messages
- ✅ Manages room connections
- ❌ Never stores messages
- ❌ Cannot decrypt messages
- ❌ Doesn't log message content

### Can I use this at work?

**Maybe.** Considerations:
- Some corporate networks block WebSocket connections
- IT policies may prohibit personal cloud deployments
- Self-hosting gives you more control

**Alternative:** Deploy on your own domain/infrastructure for enterprise use.

---

## Key Takeaways

✅ **Zero configuration** - Deploy and relay mode works automatically
✅ **Secure by default** - E2E encryption, visual verification
✅ **No cloud storage** - Your data stays on your devices
✅ **No API costs** - Uses your existing Claude.ai subscription
✅ **Works anywhere** - Access from any device, any network
✅ **Free deployment** - Vercel free tier is sufficient

🎉 **Enjoy your cloud-accessible Jarvis UI!**

---

## Need Help?

- **Troubleshooting:** See sections above
- **Main README:** [README.md](README.md) for general usage
- **GitHub Issues:** Report bugs or request features
- **OpenClaw Docs:** [openclaw.com](https://openclaw.com) for gateway configuration

---

## Changelog

### v1.0.0 - Initial Vercel Deployment Support
- Added automatic production mode detection
- Enforced relay-only mode for cloud deployments
- Created comprehensive deployment documentation
- Added security headers via vercel.json
- Implemented environment-aware configuration
