import crypto from "node:crypto";
import fs from "node:fs/promises";
import registerGitHubApp from "./lib/register-github-app/index.js";

// Helper function to write .env file with actual values
async function writeEnvFile(envObj) {
  const envContent = Object.entries(envObj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  await fs.writeFile('.env', envContent);
  console.log('[setup] ✅ Created .env file with GitHub App credentials');
}

// Helper function to write .env.example file with placeholders
async function writeEnvExample(envObj) {
  const envContent = Object.entries(envObj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  await fs.writeFile('.env.example', envContent);
  console.log('[setup] ✅ Created .env.example file with placeholders');
}

// Generic callback helper for when GitHub App is received
function onReceivedGitHubApp(appObj, res) {
  console.log(`[setup] 📱 Received GitHub App: ${appObj.name} (ID: ${appObj.id})`);
  
  // Check if we have the required credentials
  if (appObj.id && appObj.client_id) {
    // Write .env with actual values
    const envObj = {
      GITHUB_APP_ID: appObj.id,
      GITHUB_APP_PRIVATE_KEY: `"${appObj.pem.replace(/\n/g, '\\n')}"`,
      PUBLIC_PROJECT_REPO: `"${appObj.owner.login}/jargons.dev-test"`,
      PUBLIC_PROJECT_REPO_BRANCH_REF: '"refs/heads/main"'
    };
    writeEnvFile(envObj);
  } else {
    // Write .env.example with placeholders
    const envObj = {
      GITHUB_APP_ID: 'your-github-app-id',
      GITHUB_APP_PRIVATE_KEY: '"your-github-app-private-key"',
      PUBLIC_PROJECT_REPO: '"your-username/jargons.dev-test"',
      PUBLIC_PROJECT_REPO_BRANCH_REF: '"refs/heads/main"'
    };
    writeEnvExample(envObj);
  }
  
  // Respond to browser
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <meta charset="utf-8">
    <h1>GitHub App registered successfully</h1>
    <p>Environment file has been created. You can now close this window.</p>
  `);
}

// Add 2-minute friendly timeout
setTimeout(() => {
  console.log('[setup] ⏰ Setup process has been running for 2 minutes. If you haven\'t completed the GitHub App registration yet, please check your browser.');
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
