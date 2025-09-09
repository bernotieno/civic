# ⚡ CivicAI Quick Deploy (5 Minutes)

## 🚀 Prerequisites
- GitHub account
- Render account (free)
- External Redis (RedisLabs free tier)

## 📋 Step-by-Step

### 1. Setup Redis (2 minutes)
```bash
# Go to https://redis.com/try-free/
# Create account → New database → Copy connection string
# Example: redis://username:password@host:port
```

### 2. Push to GitHub (1 minute)
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 3. Deploy Backend (1 minute)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. New → Web Service
3. Connect GitHub → Select repo
4. Settings:
   - **Name**: `civicai-backend`
   - **Environment**: Python 3
   - **Build**: `./build.sh`
   - **Start**: `python start_server.py`
   - **Plan**: Free

5. Environment Variables:
```
SECRET_KEY=[auto-generate]
DEBUG=false
REDIS_URL=redis://your-redis-connection-string
DATABASE_URL=[will be auto-set]
OPENAI_API_KEY=your-key-here
ALLOWED_HOSTS=civicai-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://civicai-frontend.onrender.com
CIVICAI_FREE_TIER=true
```

### 4. Deploy Frontend (1 minute)
1. New → Web Service
2. Connect same GitHub repo
3. Settings:
   - **Name**: `civicai-frontend`
   - **Environment**: Node
   - **Root Directory**: `frontend`
   - **Build**: `npm ci && npm run build`
   - **Start**: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

4. Environment Variables:
```
VITE_API_BASE_URL=https://civicai-backend.onrender.com
```

### 5. Create Database (30 seconds)
1. New → PostgreSQL
2. Settings:
   - **Name**: `civicai-postgres`
   - **Database**: `civicai_db`
   - **User**: `civicai_user`
   - **Plan**: Free

## ✅ Verify Deployment

Backend: `https://civicai-backend.onrender.com/api/health/`
Frontend: `https://civicai-frontend.onrender.com`

## 🔧 If Something Breaks

1. **Build fails**: Check logs in Render dashboard
2. **Can't connect**: Verify CORS settings
3. **Database issues**: Check DATABASE_URL
4. **Redis issues**: Verify external Redis URL

## 💡 Pro Tips

- Services sleep after 15min → Use UptimeRobot
- Build timeout → Use `requirements-render.txt`
- Memory issues → Reduce file sizes
- Need help → Check full deployment guide

**Total Time**: ~5 minutes
**Cost**: $0 (+ Redis provider ~$0-5/month)