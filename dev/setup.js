import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import registerGitHubApp from "./lib/register-github-app/index.js";

// --- Setup helpers: safe .env writer & fallback ---

function writeEnvFile(envObj) {
  try {
    const lines = Object.entries(envObj).map(([k, v]) => `${k}=${String(v || '')}`);
    const file = path.resolve(process.cwd(), '.env');
    fsSync.writeFileSync(file, lines.join('\n') + '\n', { encoding: 'utf8' });
    console.log(`[setup] .env written to ${file}`);
  } catch (err) {
    console.error('[setup] Failed to write .env:', err && err.message ? err.message : err);
  }
}

function writeEnvExample(envObj) {
  try {
    const file = path.resolve(process.cwd(), '.env.example');
    const lines = Object.entries(envObj).map(([k, v]) => `${k}=${v ? v : `YOUR_${k}`}`);
    fsSync.writeFileSync(file, lines.join('\n') + '\n', { encoding: 'utf8' });
    console.log(`[setup] .env.example written to ${file}`);
  } catch (err) {
    console.error('[setup] Failed to write .env.example:', err && err.message ? err.message : err);
  }
}
// --- end helpers ---

async function onReceivedGitHubApp(appObj, res) {
  try {
    if (!appObj) {
      console.log('[setup] Callback received but no app data');
      res && res.end && res.end('Setup: no app data received. Check terminal for details.');
      return;
    }

    console.log('[setup] Received GitHub App:', { id: appObj.id, name: appObj.name });

    const envObj = {
      GITHUB_APP_ID: appObj.id || '',
      GITHUB_APP_CLIENT_ID: appObj.client_id || '',
      GITHUB_APP_CLIENT_SECRET: appObj.client_secret || '',
      GITHUB_APP_WEBHOOK_SECRET: appObj.webhook_secret || ''
    };

    if (envObj.GITHUB_APP_ID && envObj.GITHUB_APP_CLIENT_ID) {
      writeEnvFile(envObj);
      res && res.end && res.end('Setup complete — .env created locally. Check your repo root.');
    } else {
      console.log('[setup] Incomplete app data; writing .env.example as fallback');
      writeEnvExample(envObj);
      res && res.end && res.end('Partial setup — .env.example created. Please fill missing values and rerun.');
    }
  } catch (err) {
    console.error('[setup] Error in callback handler:', err && err.message ? err.message : err);
    res && res.end && res.end('Setup failed — check terminal logs.');
  }
}

// Add 2-minute friendly timeout log after server start
setTimeout(() => {
  console.log('[setup] If no callback is received, ensure you opened the printed URL in a browser logged into GitHub or use ngrok/curl to simulate the callback.');
}, 120000);

// register app and retrieve credentials
const appCredentials = await registerGitHubApp({
  // name of your app
  name: "jargons.dev-app-for-",
  url: "https://github.com/jargonsdev/jargons.dev/CONTRIBUTING.md",
  default_permissions: {
    issues: "write",
  },
}, {
  onReceivedGitHubApp: onReceivedGitHubApp
});
