#!/usr/bin/env node

/**
 * Deploy script for Cloudflare Workers
 *
 * This script:
 * 1. Reads vars from wrangler.jsonc
 * 2. Sets them as environment variables for the build
 * 3. Runs the build with correct NEXT_PUBLIC_* variables
 * 4. Deploys to Cloudflare
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

console.log("🚀 Starting Cloudflare deployment...\n");

// 1. Read wrangler.jsonc with better JSONC parsing
console.log("📖 Reading wrangler.jsonc...");
const wranglerContent = readFileSync("./wrangler.jsonc", "utf-8");

// Simple JSONC parser: remove // comments and /* */ comments
const jsonContent = wranglerContent
  .split("\n")
  .map((line) => {
    // Remove // comments but preserve strings
    const commentIndex = line.indexOf("//");
    if (commentIndex !== -1) {
      // Check if // is inside a string
      const beforeComment = line.substring(0, commentIndex);
      const quotes = (beforeComment.match(/"/g) || []).length;
      if (quotes % 2 === 0) {
        // Even number of quotes means // is outside string
        return line.substring(0, commentIndex);
      }
    }
    return line;
  })
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove /* */ comments

const wranglerConfig = JSON.parse(jsonContent);

// 2. Extract vars
const vars = wranglerConfig.vars || {};
console.log("✅ Found environment variables:", Object.keys(vars).join(", "));

// 3. Build environment variables string
const envVars = Object.entries(vars)
  .map(([key, value]) => `${key}="${value}"`)
  .join(" ");

console.log("\n🔨 Building Next.js app with production variables...");

// 4. Clean previous builds
execSync("rm -rf .next .open-next", { stdio: "inherit" });

// 5. Build with environment variables
execSync(`${envVars} NODE_ENV=production npx opennextjs-cloudflare build`, {
  stdio: "inherit",
  shell: true,
});

console.log("\n📦 Deploying to Cloudflare...");

// 6. Deploy
execSync("npx wrangler deploy", { stdio: "inherit" });

console.log("\n✅ Deployment complete!");
console.log("🌐 Your app is live at: https://templator.essedev.it");
