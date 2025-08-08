#!/usr/bin/env node

/**
 * This script helps deploy the application to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env.production exists, if not create one from .env
const envPath = path.join(__dirname, '.env');
const prodEnvPath = path.join(__dirname, '.env.production');

if (!fs.existsSync(prodEnvPath) && fs.existsSync(envPath)) {
  console.log('Creating .env.production from .env...');
  fs.copyFileSync(envPath, prodEnvPath);
  console.log('Please review .env.production and update any production-specific values.');
}

// Check for vercel.json
if (!fs.existsSync(path.join(__dirname, 'vercel.json'))) {
  console.error('vercel.json file not found. Please make sure it exists before deploying.');
  process.exit(1);
}

// Run the deployment command
try {
  console.log('Deploying to Vercel...');
  execSync('vercel', { stdio: 'inherit' });
  console.log('Deployment initiated. Follow the prompts in the console.');
} catch (error) {
  console.error('Deployment failed:', error);
  console.log('\nMake sure you have the Vercel CLI installed:');
  console.log('npm i -g vercel');
}
