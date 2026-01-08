# Vercel Deployment Instructions

## Fix: Environment Variable "VITE_API_BASE" Error

This error occurs when Vercel can't find the environment variables. Here's how to fix it:

### **Step 1: Go to Vercel Project Settings**
1. Visit https://vercel.com/dashboard
2. Find your POSIfine11 project
3. Click **Settings** (top navigation)
4. Go to **Environment Variables**

### **Step 2: Add Environment Variables**
Click **Add New** and add these two variables:

**Variable 1:**
- Name: `VITE_API_BASE`
- Value: `https://posifine22-1.onrender.com/api`
- Select: **Production**, **Preview**, **Development**
- Click **Save**

**Variable 2:**
- Name: `VITE_API_URL`
- Value: `https://posifine22-1.onrender.com`
- Select: **Production**, **Preview**, **Development**
- Click **Save**

### **Step 3: Redeploy**
1. Go back to **Deployments**
2. Find the latest failed deployment
3. Click the **three dots (...)** menu
4. Click **Redeploy**
5. Wait 2-3 minutes for deployment to complete

### **Step 4: Test**
Once deployment completes (shows "Ready"):
1. Click on the project URL to open the frontend
2. Click **Sign Up**
3. Enter test credentials:
   - Email: `user@test.com`
   - Password: `Test123!`
   - Name: `Test User`
   - Plan: Select a plan (Admin: 1600 or Cashier: 900)
4. Should see dashboard after signup ✅

## Alternative: If Vercel redeploy still fails

Go to **Settings > Git** and disable/re-enable GitHub integration to force a full rebuild.

## Environment Variables Summary
```
VITE_API_BASE=https://posifine22-1.onrender.com/api
VITE_API_URL=https://posifine22-1.onrender.com
```

These point your frontend to the running Render backend.
