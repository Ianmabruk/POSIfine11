# Manual Backend Deployment - Simple Steps

## 🎯 You Need to Deploy Your Backend

Your POS system is in "Demo Mode" because the Flask backend isn't deployed yet.

---

## ⚡ Quick Deploy (Choose One Method)

### Method 1: Railway (Recommended - Free)

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

**Step 2: Login**
```bash
railway login
```
(Opens browser, sign up with GitHub)

**Step 3: Deploy**
```bash
cd my-react-app/src/backend
railway init
railway up
railway domain
```

**Step 4: Copy Your URL**
You'll get a URL like: `https://pos-backend-production-xxxx.up.railway.app`

**Step 5: Set Secret**
```bash
railway variables set JWT_SECRET=your-secret-key-123456
railway up
```

---

### Method 2: Render (Also Free)

**Step 1: Go to Render**
Visit: https://render.com

**Step 2: Sign Up**
Use GitHub to sign up (free)

**Step 3: Create Web Service**
- Click "New +" → "Web Service"
- Connect GitHub repo or use manual deploy

**Step 4: Configure**
```
Name: pos-backend
Environment: Python 3
Root Directory: my-react-app/src/backend
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

**Step 5: Add Environment Variable**
```
JWT_SECRET = your-secret-key-123456
```

**Step 6: Deploy**
Click "Create Web Service"

**Step 7: Copy URL**
From Render dashboard

---

## 🔗 Connect Frontend to Backend

**Step 1: Edit API File**

Open: `my-react-app/src/services/api.js`

**Find:**
```javascript
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
```

**Replace with:**
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://YOUR-BACKEND-URL-HERE.railway.app/api'  // ← Paste your URL
  : 'http://localhost:5001/api';
```

**Step 2: Rebuild**
```bash
cd my-react-app
npm run build
```

**Step 3: Redeploy**
```bash
netlify deploy --prod
```

---

## ✅ Test It Works

**Visit your site:**
```
https://posifynet.netlify.app
```

**Check:**
- ✅ No "Demo Mode" banner
- ✅ Signup creates real account
- ✅ Login works
- ✅ Data persists

---

## 🆘 Need Help?

**Railway Issues:**
- Run: `railway logs` to see errors
- Check: https://docs.railway.app

**Render Issues:**
- Check "Logs" tab in Render dashboard
- Check: https://render.com/docs

**Still Stuck?**
- Check browser console (F12)
- Look for CORS errors
- Verify backend URL is correct

---

## 💡 Quick Troubleshooting

**Issue: CORS Error**
- Backend URL must end with `/api`
- Check CORS is enabled in app.py

**Issue: 502 Error**
- Backend might be starting (wait 1 min)
- Check Railway/Render logs

**Issue: Login Fails**
- Check JWT_SECRET is set
- Verify backend is running

---

## 🎉 Success Checklist

- [ ] Railway CLI installed
- [ ] Backend deployed
- [ ] Got backend URL
- [ ] Updated src/services/api.js
- [ ] Rebuilt frontend
- [ ] Redeployed to Netlify
- [ ] Tested signup/login
- [ ] No demo mode banner
- [ ] All features work

---

Your backend is ready to deploy! Follow the steps above. 🚀