#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const packagePath = resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

function updateVersion(type) {
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  let newVersion;
  switch (type) {
    case "patch":
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case "minor":
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case "major":
      newVersion = `${major + 1}.0.0`;
      break;
    default:
      console.error("Invalid version type. Use: patch, minor, or major");
      process.exit(1);
  }

  return newVersion;
}

function createRelease(type, options = {}) {
  try {
    console.log(`🚀 Creating ${type} release...`);

    // Update version
    const newVersion = updateVersion(type);
    packageJson.version = newVersion;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

    console.log(`📦 Version updated to ${newVersion}`);

    // Build the project
    console.log("🔨 Building project...");
    execSync("npm run build", { stdio: "inherit" });

    // Create git commit
    console.log("📝 Creating git commit...");
    execSync(`git add package.json`, { stdio: "inherit" });
    execSync(`git commit -m "chore: release version ${newVersion}"`, {
      stdio: "inherit",
    });

    // Create git tag
    console.log("🏷️  Creating git tag...");
    execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`, {
      stdio: "inherit",
    });

    // Push changes
    console.log("📤 Pushing changes...");
    execSync("git push origin main", { stdio: "inherit" });
    execSync(`git push origin v${newVersion}`, { stdio: "inherit" });

    // Deploy to Vercel if requested
    if (options.deploy) {
      console.log("🚀 Deploying to Vercel...");
      try {
        execSync("vercel --prod", { stdio: "inherit" });
        console.log("✅ Deployed to Vercel successfully!");
      } catch (deployError) {
        console.warn("⚠️  Vercel deployment failed, but release was created");
        console.warn("   You can deploy manually with: vercel --prod");
      }
    }

    console.log(`✅ Release ${newVersion} created successfully!`);
    console.log(`📋 Next steps:`);
    if (!options.deploy) {
      console.log(`   1. Deploy manually: vercel --prod`);
      console.log(`   2. Or use: npm run release:${type} --deploy`);
    }
    console.log(`   3. Check Sentry for the new release: ${newVersion}`);
    console.log(`   4. Monitor your application for any issues`);
  } catch (error) {
    console.error("❌ Error creating release:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const type = args[0];
const options = {
  deploy: args.includes("--deploy") || args.includes("-d"),
};

if (!type || !["patch", "minor", "major"].includes(type)) {
  console.log("Usage: npm run release <patch|minor|major> [--deploy]");
  console.log("");
  console.log("Examples:");
  console.log("  npm run release patch           # 0.1.0 → 0.1.1");
  console.log("  npm run release minor           # 0.1.0 → 0.2.0");
  console.log("  npm run release major           # 0.1.0 → 1.0.0");
  console.log("  npm run release patch --deploy  # Release + deploy to Vercel");
  console.log("");
  console.log("Options:");
  console.log("  --deploy, -d    Deploy to Vercel after release");
  process.exit(1);
}

createRelease(type, options);
