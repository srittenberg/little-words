#!/bin/bash
# Setup script for connecting to GitHub
# Run this after installing Xcode Command Line Tools

set -e

echo "Initializing git repository..."
git init

echo "Adding all files..."
git add .

echo "Making initial commit..."
git commit -m "Initial commit: Next.js app with Tailwind and shadcn/ui setup"

echo "Adding remote origin..."
git remote add origin git@github.com:srittenberg/little-words.git || git remote set-url origin git@github.com:srittenberg/little-words.git

echo "Setting default branch to main..."
git branch -M main

echo ""
echo "✅ Git repository initialized and connected to GitHub!"
echo ""
echo "Next steps:"
echo "1. Make sure you have SSH keys set up with GitHub"
echo "2. Run: git push -u origin main"
echo ""
