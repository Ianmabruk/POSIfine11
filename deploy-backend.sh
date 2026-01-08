#!/bin/bash

echo "🚀 POS Backend Deployment Script"
echo "================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Logging into Railway..."
railway login

echo ""
echo "📁 Navigating to backend folder..."
cd src/backend

echo ""
echo "🎯 Initializing Railway project..."
railway init

echo ""
echo "🚀 Deploying backend..."
railway up

echo ""
echo "🌐 Setting up domain..."
railway domain

echo ""
echo "🔑 Setting JWT secret..."
echo "Enter a strong JWT secret (or press Enter for auto-generated):"
read jwt_secret

if [ -z "$jwt_secret" ]; then
    jwt_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "Generated JWT secret: $jwt_secret"
fi

railway variables set JWT_SECRET=$jwt_secret

echo ""
echo "🔄 Redeploying with environment variables..."
railway up

echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your Railway URL from above"
echo "2. Update src/services/api.js with your Railway URL"
echo "3. Run: npm run build"
echo "4. Run: netlify deploy --prod"
echo ""
echo "🎉 Your POS system will be fully functional!"