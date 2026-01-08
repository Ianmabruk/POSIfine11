# Deploy Frontend to Netlify

Follow these steps to deploy your POSIfine11 frontend to Netlify:

## **Step 1: Go to Netlify**
1. Visit https://app.netlify.com
2. Sign up or log in with GitHub

## **Step 2: Connect Your Repository**
1. Click **Add new site** → **Import an existing project**
2. Choose **GitHub** as your provider
3. Authorize Netlify to access your GitHub account
4. Search for and select `POSIfine11` repository
5. Click **Install** (if prompted)

## **Step 3: Configure Build Settings**
Netlify should auto-detect these, but verify:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

These are already configured in `netlify.toml`, so they should be auto-filled.

## **Step 4: Set Environment Variables (IMPORTANT)**
1. Under **Site settings** → **Build & deploy** → **Environment**
2. Click **Edit variables**
3. Add these two variables:

**Variable 1:**
- Key: `VITE_API_BASE`
- Value: `https://posifine22-1.onrender.com/api`

**Variable 2:**
- Key: `VITE_API_URL`
- Value: `https://posifine22-1.onrender.com`

Click **Save** after adding each variable.

## **Step 5: Deploy**
1. Click **Deploy site**
2. Wait 2-3 minutes for build to complete
3. Once it says "Published", your site is live! 🎉

You'll get a Netlify URL like: `https://your-site-name.netlify.app`

## **Step 6: Test Your Frontend**
1. Open your Netlify URL
2. Click **Sign Up**
3. Enter test credentials:
   - Email: `testuser@example.com`
   - Password: `Test123!`
   - Name: `Test User`
   - Plan: Select Admin (1600) or Cashier (900)
4. Should see dashboard after signup ✅

## **Troubleshooting**

If you see "Environment Variable references Secret which does not exist":
- Go to **Site settings** → **Build & deploy** → **Environment**
- Verify both `VITE_API_BASE` and `VITE_API_URL` are added
- Trigger a **Manual redeploy** from the **Deployments** tab

If signup shows 500 error:
- Go to https://posifine22-1.onrender.com/
- Verify backend is running (should show "POS API is running")
- Check that Render backend has been manually redeployed with latest code

## **Environment Variables are Already Set**
✅ `netlify.toml` contains hardcoded environment variables
✅ These can be overridden in Netlify dashboard if needed
✅ Frontend will build with correct backend URL embedded

That's it! Your frontend will auto-deploy whenever you push to the `main` branch on GitHub.
