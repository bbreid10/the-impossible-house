# Publish The Impossible House V8 with connected Render

Render is connected to this ChatGPT session and its workspace can be read. **A live service cannot be created until the V8 files are in a GitHub repository that Render can clone.** The connected GitHub integration currently exposes only an unrelated archived repository, so it has not been modified.

## Step A. Create a game repository (one time)

1. Sign in to GitHub and visit **https://github.com/new**.
2. Name the repository `the-impossible-house`. Choose Public for the simplest playtest setup, or Private if you prefer and have granted Render access to private GitHub repositories.
3. Unzip `The_Impossible_House_V8_Multiplayer.zip` on your computer. In the **new** GitHub repository click **Add file → Upload files**. Drag the *contents* of the unzipped folder (not the ZIP itself) onto that page. Confirm `server.js`, `index.html`, `app.js`, `engine.js`, `art.js`, `package.json`, `v8.css`, `render.yaml`, and the `assets` folder are at the root.
4. Click **Commit changes**. Copy the repo URL, e.g. `https://github.com/YOUR-USERNAME/the-impossible-house`. Share it in ChatGPT. You should never need to paste Render tokens or a password.

## Step B. Deploy with Render (or ask ChatGPT to create it)

Once the GitHub repo URL exists, ChatGPT's connected Render tool can create a Node Web Service:

- **Service**: Web Service (not Static Site)
- **Repository**: the GitHub URL above, branch `main`
- **Name**: `impossible-house-coop` or an available variant
- **Runtime**: Node
- **Build command**: `npm install`
- **Start command**: `npm start`
- **Instance plan**: Free, if available
- **Region**: Virginia (or preferred region)
- **Health check**: `/api/health`
- **Auto deploy**: Yes

You can also do this at **https://dashboard.render.com**, choose New → Web Service, and connect that repository. The optional `render.yaml` contains the same commands.

## Step C. Verify and share

Wait for Render's **Live** status. Open the **exact** URL returned by Render, then test `https://YOUR-URL/api/health` and ensure it returns `"ok":true`. On two different devices, create a Private room, share its invite link, join, mark Ready, and test movement, shared map rotation, casting a law, and the Chapter 2 shared hunt. Only then distribute the real URL to playtesters.

**Hosting caution:** Free services may spin down when idle and take time to wake. Since this prototype stores online rooms in RAM, any restart/sleep/deploy wipes active sessions. Don't rely on it for long-lived saves or moderation. Review plan details in Render's dashboard before deploying.
