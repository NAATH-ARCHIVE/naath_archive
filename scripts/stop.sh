#!/bin/bash
echo "🛑 Stopping development servers..."

# Kill Node.js processes
pkill -f "npm run dev" || true
pkill -f "vite" || true

echo "✅ Development servers stopped"
