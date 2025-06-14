#!/usr/bin/env node

/**
 * Simple build test script for Book Organizer Frontend
 * Run with: node build-test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Testing Book Organizer Frontend Build...\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Make sure you\'re in the frontend directory.');
  process.exit(1);
}

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Run build
  console.log('\n🏗️ Building production app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if build directory exists
  if (fs.existsSync('build')) {
    const buildFiles = fs.readdirSync('build');
    console.log('\n✅ Build successful!');
    console.log(`📁 Build directory contains ${buildFiles.length} files/folders`);
    console.log('📋 Key files:');
    
    const keyFiles = ['index.html', '_app', 'favicon.png'];
    keyFiles.forEach(file => {
      if (buildFiles.includes(file)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❓ ${file} (optional)`);
      }
    });
    
    console.log('\n🚀 Ready for deployment!');
    console.log('💡 Next steps:');
    console.log('   1. Go to netlify.com and create account');
    console.log('   2. Drag the build/ folder to deploy area');
    console.log('   3. Add environment variable: VITE_API_URL=https://your-backend.onrender.com');
    console.log('   4. Your app will be live! 🎉');
    
  } else {
    console.error('❌ Build directory not found after build');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Build failed:');
  console.error(error.message);
  console.log('\n🔧 Try these troubleshooting steps:');
  console.log('   1. Delete node_modules and package-lock.json');
  console.log('   2. Run npm install again');
  console.log('   3. Check Node.js version (should be 16+ or 18+)');
  process.exit(1);
}