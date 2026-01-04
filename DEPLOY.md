# Deploy to Netlify

## Quick Deploy

### Option 1: Netlify CLI (Recommended)

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify:**
```bash
netlify login
```

3. **Deploy:**
```bash
netlify deploy --prod
```

### Option 2: GitHub + Netlify

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Build settings are auto-detected from netlify.toml
   - Click "Deploy site"

3. **Set Environment Variables:**
   - In Netlify dashboard: Site settings → Environment variables
   - Add: `JWT_SECRET` = your-secret-key-here

### Option 3: Drag & Drop

1. **Build locally:**
```bash
npm run build
```

2. **Deploy:**
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder
   - Note: Functions won't work with this method

## Environment Variables

### Generate JWT Secret:
```bash
node generate-secret.cjs
```
This will generate a secure random secret. Copy it.

### Add to Netlify:

1. Go to https://app.netlify.com
2. Select your deployed site
3. Click **"Site settings"** in the top menu
4. Click **"Environment variables"** in the left sidebar
5. Click **"Add a variable"** button
6. Enter:
   - **Key:** `JWT_SECRET`
   - **Value:** (paste your generated secret)
7. Click **"Create variable"**
8. Go to **Deploys** tab and click **"Trigger deploy"** → **"Deploy site"**

**Required Variables:**
- `JWT_SECRET` - Your JWT secret key (use generated one)

## Post-Deploy

1. **Test the site:**
   - Visit your Netlify URL
   - Sign up as first user (becomes admin)
   - Test all features

2. **Custom Domain (Optional):**
   - Netlify Dashboard → Domain settings
   - Add custom domain

## Important Notes

⚠️ **Data Storage:** Currently uses in-memory storage. Data resets on function restart.

For production, consider:
- MongoDB Atlas (free tier)
- Supabase
- Firebase
- FaunaDB

## Troubleshooting

**Functions not working:**
- Check Netlify Functions logs
- Verify JWT_SECRET is set
- Check CORS settings

**Build fails:**
- Run `npm run build` locally first
- Check Node version (should be 18+)
- Clear Netlify cache and redeploy

**API errors:**
- Check Network tab in DevTools
- Verify API_URL in src/services/api.js
- Check function logs in Netlify dashboard
