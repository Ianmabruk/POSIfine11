#!/bin/bash

# Frontend Deployment Helper Script

set -e

echo "🚀 Frontend Deployment Assistant"
echo "=================================="
echo ""

# Check if build exists
if [ ! -d "dist" ]; then
    echo "📦 Building frontend..."
    npm run build
else
    echo "✓ Build already exists"
fi

echo ""
echo "Choose your deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify"
echo "3) GitHub Pages"
echo "4) Docker (manual deploy)"
echo "5) View build stats"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "📤 Deploying to Vercel..."
        echo "Visit: https://vercel.com"
        echo ""
        echo "Steps:"
        echo "1. Sign up at vercel.com"
        echo "2. Connect your GitHub account"
        echo "3. Import 'my-react-app' repository"
        echo "4. Add these environment variables:"
        echo "   VITE_API_BASE: https://your-backend-api.com/api"
        echo "   VITE_API_URL: https://your-backend-api.com"
        echo "5. Click Deploy"
        echo ""
        read -p "Install Vercel CLI? (y/n): " vercel_install
        if [ "$vercel_install" = "y" ]; then
            npm i -g vercel
            vercel
        fi
        ;;
    2)
        echo ""
        echo "📤 Deploying to Netlify..."
        echo "Visit: https://netlify.com"
        echo ""
        read -p "Install Netlify CLI? (y/n): " netlify_install
        if [ "$netlify_install" = "y" ]; then
            npm i -g netlify-cli
            netlify deploy --prod --dir=dist
        fi
        ;;
    3)
        echo ""
        echo "📤 Deploying to GitHub Pages..."
        echo "Add to package.json:"
        echo '  "deploy": "npm run build && gh-pages -d dist"'
        echo ""
        read -p "Install gh-pages? (y/n): " ghpages_install
        if [ "$ghpages_install" = "y" ]; then
            npm install --save-dev gh-pages
            npm run deploy
        fi
        ;;
    4)
        echo ""
        echo "🐳 Docker build info:"
        echo "Build command: docker build -t posifine-frontend ."
        echo "Run command: docker run -p 3000:80 posifine-frontend"
        echo ""
        if [ -f "Dockerfile" ]; then
            read -p "Build Docker image now? (y/n): " docker_build
            if [ "$docker_build" = "y" ]; then
                docker build -t posifine-frontend .
                echo "✓ Image built. Run with:"
                echo "  docker run -p 3000:80 posifine-frontend"
            fi
        fi
        ;;
    5)
        echo ""
        echo "📊 Build Statistics:"
        echo "===================="
        du -sh dist/
        echo ""
        echo "Asset breakdown:"
        ls -lh dist/assets/ | tail -n +2 | awk '{printf "  %-50s %10s\n", $9, $5}'
        echo ""
        echo "Files:"
        find dist -type f | wc -l
        echo "files"
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

echo ""
echo "✓ Done!"
