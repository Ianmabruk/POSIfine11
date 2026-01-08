# Frontend Deployment Guide

## Production Build Ready ✓

Your frontend is built and ready for deployment at: `dist/`

**Build Statistics:**
- CSS: 52.40 KB (8.27 KB gzipped)
- JavaScript: ~420 KB (92 KB gzipped)
- HTML: 0.58 KB
- Total: ~426 KB (100 KB gzipped)

---

## Quick Deploy Options

### 1. **Vercel (Recommended - Zero Config)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from my-react-app folder
cd my-react-app
vercel

# Add environment variables in Vercel dashboard:
# VITE_API_BASE: https://your-backend-api.com/api
# VITE_API_URL: https://your-backend-api.com
```

**Pros:** Automatic deployments from GitHub, edge network, serverless functions
**Deployment time:** 2-3 minutes
**Cost:** Free tier available

---

### 2. **Netlify**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd my-react-app
netlify deploy --prod --dir=dist

# Or connect GitHub for auto-deploys
```

**Configuration file:** `netlify.toml` (already in project)
**Cost:** Free tier with 300 build minutes/month
**Deployment time:** 1-2 minutes

---

### 3. **GitHub Pages (Free Static Host)**

```bash
# Add to package.json
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

**Pros:** Free, integrated with GitHub
**Cons:** No server-side rendering, subdomain required
**Cost:** Free

---

### 4. **AWS S3 + CloudFront**

```bash
# Build and upload
npm run build
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

**Cost:** Pay-per-use (cheap for static sites)
**Speed:** Global CDN with CloudFront
**Setup time:** 15-20 minutes

---

### 5. **Docker + Any Server (Render, Railway, Heroku)**

```dockerfile
# Dockerfile (already in project)
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Deploy to Render:**
```bash
# Connect GitHub repo to Render
# Set build command: npm install --legacy-peer-deps && npm run build
# Set start command: serve -s dist -l 3000
# Cost: Free tier available
```

---

## Environment Variables Setup

### Production URLs

For **HTTPS backend** (recommended):
```bash
VITE_API_BASE=https://posifine-backend.render.com/api
VITE_API_URL=https://posifine-backend.render.com
```

For **Local testing**:
```bash
VITE_API_BASE=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
```

---

## Pre-Deployment Checklist

- [x] Production build created (`npm run build`)
- [ ] Backend API deployed and running
- [ ] Backend JWT_SECRET configured in production
- [ ] CORS enabled for frontend domain on backend
- [ ] Environment variables set (VITE_API_BASE, VITE_API_URL)
- [ ] Test authentication flow (signup/login)
- [ ] Test cashier dashboard with products
- [ ] Test admin dashboard with sales
- [ ] Verify real-time product sync
- [ ] Test with HTTPS (not HTTP)

---

## Testing Production Build Locally

```bash
# Install serve globally
npm i -g serve

# Serve production build locally
cd my-react-app
serve -s dist -l 3000

# Test at http://localhost:3000
```

---

## Performance Optimization

Already implemented:
- ✓ Code splitting with React.lazy()
- ✓ CSS minification
- ✓ JavaScript minification
- ✓ Gzip compression ready
- ✓ Tree shaking enabled

**Additional recommendations:**
1. Enable HTTP/2 on server
2. Use CDN for static assets
3. Enable browser caching (Cache-Control headers)
4. Compress images
5. Monitor with Sentry or similar

---

## Post-Deployment

1. **Monitor Performance**
   - Check Lighthouse score
   - Monitor Core Web Vitals
   - Set up error tracking (Sentry, LogRocket)

2. **Setup CI/CD**
   - Auto-build on GitHub push
   - Run tests before deploy
   - Auto-rollback on failure

3. **Enable Analytics**
   - Google Analytics
   - Hotjar or FullStory
   - Custom event tracking

4. **Security Hardening**
   - Enable HTTPS (SSL/TLS)
   - Set security headers
   - Regular dependency updates
   - Code scanning with GitHub

---

## Recommended Deployment: Vercel

**Why Vercel?**
- Zero-config deployment
- Automatic HTTPS
- Global edge network
- Seamless GitHub integration
- Free tier generous
- Preview URLs for testing
- Performance optimizations built-in

**Steps (5 minutes):**

1. Sign up: https://vercel.com
2. Connect GitHub account
3. Import `my-react-app` repository
4. Add environment variables (API URLs)
5. Click Deploy
6. Done! Auto-deploys on GitHub push

---

## Support

For deployment issues:
- Check backend is running and accessible
- Verify CORS headers from backend
- Check browser console for errors
- Verify environment variables are set
- Check network requests in DevTools

**Backend must be accessible before frontend deployment!**
