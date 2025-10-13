---
description: Deploy application to Cloudflare Workers
---

# Deploy to Cloudflare

Automatically deploy the application to Cloudflare Workers.

Execute these steps:

1. **Pre-deployment checks**:
   - Verify `wrangler.jsonc` exists and has the required `vars` configuration
   - Check that `scripts/deploy.mjs` exists
   - Verify the user is authenticated with Cloudflare by running `npx wrangler whoami`
   - If not authenticated: instruct user to run `npx wrangler login`

2. **Verify secrets are configured** (first-time setup):
   - Check if secrets are set by running `npx wrangler secret list`
   - Required secrets:
     - `DATABASE_URL` - PostgreSQL connection string
     - `BETTER_AUTH_SECRET` - Auth secret (generate with: `openssl rand -base64 32`)
   - If missing: Show instructions on how to set them:
     ```bash
     echo "your-database-url" | npx wrangler secret put DATABASE_URL
     echo "your-secret" | npx wrangler secret put BETTER_AUTH_SECRET
     ```
   - Ask user if they want to continue or set secrets first

3. **Show deployment summary**:
   - Display current branch and last commit
   - Show environment variables from wrangler.jsonc that will be used
   - Show worker name from wrangler.jsonc
   - Ask for confirmation: "Deploy to Cloudflare? (yes/no)"

4. **Execute deployment**:
   - Run `npm run deploy` (which executes `scripts/deploy.mjs`)
   - The script will:
     - Read vars from wrangler.jsonc
     - Clean previous builds (.next, .open-next)
     - Build Next.js app with production variables
     - Deploy to Cloudflare Workers
   - Show full output in real-time

5. **Post-deployment**:
   - Confirm successful deployment
   - Show the live URL (from wrangler output or wrangler.jsonc vars)
   - Suggest testing the deployed application
   - Remind about monitoring options:
     - `npx wrangler tail --format pretty` - View real-time logs
     - Cloudflare dashboard for metrics and analytics

**Important notes**:

- Secrets are configured ONCE via `wrangler secret put` and persist across deployments
- Public environment variables are in `wrangler.jsonc` (committed to git)
- The deploy script handles NEXT*PUBLIC*\* variables correctly during build
- Deployment typically takes 2-3 minutes for build + upload

**Troubleshooting**:

- If build fails: Check that all dependencies are installed (`npm install`)
- If deploy fails: Verify Cloudflare authentication and account permissions
- If app doesn't work: Verify secrets are set correctly with `npx wrangler secret list`
