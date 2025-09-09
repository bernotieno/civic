# 🚀 CivicAI Render Deployment Guide (FREE TIER)

Complete guide to deploy CivicAI on Render's free tier with separate backend and frontend services.

## 📋 Prerequisites

- GitHub repository with your CivicAI code
- Render account (free)
- External Redis provider (RedisLabs/Upstash - free tier)
- OpenAI API key (optional)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Vite)  │◄──►│ (Django+Celery) │◄──►│  (PostgreSQL)   │
│   Free Tier     │    │   Free Tier     │    │   Free Tier     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  External Redis │
                       │  (RedisLabs)    │
                       └─────────────────┘
```

## 🔧 Step 1: Setup External Redis (Required)

Since Render's free tier doesn't include Redis, use an external provider:

### Option A: RedisLabs (Recommended)
1. Go to [RedisLabs](https://redis.com/try-free/)
2. Create free account (30MB, perfect for development)
3. Create new database
4. Copy connection string: `redis://username:password@host:port`

### Option B: Upstash
1. Go to [Upstash](https://upstash.com/)
2. Create free account (10K requests/day)
3. Create Redis database
4. Copy connection URL

## 📁 Step 2: Prepare Your Repository

Ensure these files are in your repository root:

```
civicAI/
├── build.sh                 # ✅ Created
├── start_server.py          # ✅ Created  
├── render.yaml              # ✅ Created
├── requirements.txt         # ✅ Exists
├── manage.py               # ✅ Exists
├── civicAI/
│   └── settings/
│       └── render.py       # ✅ Created
└── frontend/
    ├── package.json        # ✅ Updated
    ├── vite.config.ts      # ✅ Updated
    └── .env.production     # ✅ Created
```

## 🚀 Step 3: Deploy to Render

### Method A: Using render.yaml (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository with render.yaml
   - Click "Apply"

### Method B: Manual Setup

#### Backend Service:
1. **Create Web Service**:
   - Name: `civicai-backend`
   - Environment: `Python 3`
   - Build Command: `./build.sh`
   - Start Command: `python start_server.py`
   - Plan: `Free`

2. **Environment Variables**:
   ```
   PYTHON_VERSION=3.11.0
   ENVIRONMENT=production
   DEBUG=false
   SECRET_KEY=[auto-generated]
   ALLOWED_HOSTS=civicai-backend.onrender.com,civicai-frontend.onrender.com
   CORS_ALLOWED_ORIGINS=https://civicai-frontend.onrender.com
   DATABASE_URL=[from postgres service]
   REDIS_URL=redis://your-redis-connection-string
   CELERY_BROKER_URL=redis://your-redis-connection-string
   CELERY_RESULT_BACKEND=redis://your-redis-connection-string
   OPENAI_API_KEY=your-openai-key
   CIVICAI_FREE_TIER=true
   ```

#### Frontend Service:
1. **Create Web Service**:
   - Name: `civicai-frontend`
   - Environment: `Node`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - Plan: `Free`

2. **Environment Variables**:
   ```
   NODE_VERSION=18.17.0
   VITE_API_BASE_URL=https://civicai-backend.onrender.com
   VITE_WS_BASE_URL=wss://civicai-backend.onrender.com
   ```

#### Database Service:
1. **Create PostgreSQL Database**:
   - Name: `civicai-postgres`
   - Database Name: `civicai_db`
   - User: `civicai_user`
   - Plan: `Free`

## ⚙️ Step 4: Configure Environment Variables

### Backend Environment Variables:
```bash
# Core Django
SECRET_KEY=your-secret-key
DEBUG=false
ALLOWED_HOSTS=civicai-backend.onrender.com,civicai-frontend.onrender.com
CORS_ALLOWED_ORIGINS=https://civicai-frontend.onrender.com

# Database (auto-provided by Render)
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis (from external provider)
REDIS_URL=redis://username:password@host:port
CELERY_BROKER_URL=redis://username:password@host:port
CELERY_RESULT_BACKEND=redis://username:password@host:port

# AI Services (optional)
OPENAI_API_KEY=sk-your-openai-key
CLAUDE_API_KEY=your-claude-key

# Email (optional)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Free Tier Optimizations
CIVICAI_FREE_TIER=true
CIVICAI_ASYNC_ENABLED=true
CIVICAI_WEBSOCKET_ENABLED=false  # Disabled for free tier
CIVICAI_MAX_CONCURRENT_PROCESSING=1
```

### Frontend Environment Variables:
```bash
NODE_VERSION=18.17.0
VITE_API_BASE_URL=https://civicai-backend.onrender.com
VITE_WS_BASE_URL=wss://civicai-backend.onrender.com
```

## 🔍 Step 5: Verify Deployment

### Check Backend Health:
```bash
curl https://civicai-backend.onrender.com/api/health/
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "celery": "running"
}
```

### Check Frontend:
Visit: `https://civicai-frontend.onrender.com`

## ⚠️ Free Tier Limitations & Solutions

### 1. Service Sleep (15min inactivity)
**Problem**: Services sleep after 15 minutes of inactivity
**Solutions**:
- Use [UptimeRobot](https://uptimerobot.com/) to ping every 14 minutes
- Implement wake-up endpoint in your app
- Consider upgrading to paid tier for production

### 2. Build Time Limits (15min)
**Problem**: Complex builds may timeout
**Solutions**:
- Optimize requirements.txt (remove unused packages)
- Use build caching
- Split large builds

### 3. Memory Limits (512MB)
**Problem**: Memory-intensive operations may fail
**Solutions**:
- Reduce Celery concurrency to 1
- Disable WebSocket for free tier
- Optimize AI processing batch sizes

### 4. No Redis Service
**Problem**: Free tier doesn't include Redis
**Solutions**:
- Use external Redis provider (RedisLabs/Upstash)
- Fallback to database for caching (slower)
- Disable real-time features

## 🛠️ Free Tier Optimizations

### Backend Optimizations:
```python
# In civicAI/settings/render.py
if config('CIVICAI_FREE_TIER', default=False, cast=bool):
    # Reduce resource usage
    CIVICAI_SETTINGS.update({
        'CONCURRENT_BILL_PROCESSING': 1,
        'MAX_FILE_SIZE': 10 * 1024 * 1024,  # 10MB
        'WEBSOCKET_ENABLED': False,
        'CELERY_WORKER_CONCURRENCY': 1,
    })
    
    # Use database for sessions instead of Redis
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'
```

### Frontend Optimizations:
```typescript
// Disable heavy features for free tier
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const IS_FREE_TIER = API_BASE_URL.includes('onrender.com');

if (IS_FREE_TIER) {
  // Disable real-time features
  // Reduce polling frequency
  // Optimize bundle size
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**:
   ```bash
   # Check build logs in Render dashboard
   # Ensure all dependencies are in requirements.txt
   # Verify Python version compatibility
   ```

2. **Database Connection Issues**:
   ```bash
   # Verify DATABASE_URL is set correctly
   # Check if migrations ran successfully
   # Ensure PostgreSQL extensions are installed
   ```

3. **Redis Connection Issues**:
   ```bash
   # Verify external Redis URL is correct
   # Check Redis provider dashboard
   # Test connection manually
   ```

4. **Frontend Can't Connect to Backend**:
   ```bash
   # Verify CORS settings
   # Check VITE_API_BASE_URL
   # Ensure both services are deployed
   ```

### Debug Commands:
```bash
# Check service logs
render logs --service civicai-backend
render logs --service civicai-frontend

# Test database connection
python manage.py dbshell

# Test Redis connection
python manage.py shell
>>> from django.core.cache import cache
>>> cache.set('test', 'value')
>>> cache.get('test')
```

## 📈 Monitoring & Maintenance

### Health Checks:
- Backend: `https://civicai-backend.onrender.com/api/health/`
- Frontend: `https://civicai-frontend.onrender.com`

### Log Monitoring:
- Use Render dashboard logs
- Set up error tracking (Sentry)
- Monitor performance metrics

### Backup Strategy:
- Database: Use Render's backup features
- Media files: Consider external storage (AWS S3)
- Code: Keep GitHub repository updated

## 🚀 Scaling Beyond Free Tier

When ready to scale:

1. **Upgrade to Paid Plans**:
   - Backend: Starter ($7/month)
   - Database: Starter ($7/month)
   - Redis: Add Redis service ($7/month)

2. **Separate Services**:
   - Dedicated Celery worker
   - Celery beat scheduler
   - WebSocket support

3. **Performance Optimizations**:
   - Enable Redis caching
   - Increase worker concurrency
   - Add CDN for static files

## 📞 Support

- **Render Docs**: https://render.com/docs
- **CivicAI Issues**: Create GitHub issue
- **Community**: Join Render community forum

---

## 🎯 Quick Start Checklist

- [ ] Setup external Redis (RedisLabs/Upstash)
- [ ] Push code to GitHub with deployment files
- [ ] Create Render services (backend + frontend + database)
- [ ] Configure environment variables
- [ ] Deploy and test
- [ ] Setup monitoring/health checks
- [ ] Configure domain (optional)

**Estimated Setup Time**: 30-45 minutes

**Monthly Cost**: $0 (free tier) + Redis provider costs (~$0-5)

---

*Built with ❤️ for Kenya's civic engagement*