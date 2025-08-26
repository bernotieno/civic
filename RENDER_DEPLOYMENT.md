# 🚀 CivicAI - Render.com Deployment Guide

## Quick Deploy to Render.com

### 1. Prepare Your Repository
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### 2. Deploy Using Blueprint (Recommended)
1. Go to [Render.com](https://render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the `render.yaml` file
5. Click **"Apply"**

### 3. Manual Environment Variables (if needed)
If blueprint doesn't work, set these manually:

#### Backend Service
```
DJANGO_SETTINGS_MODULE=civicAI.settings.production
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=[Auto-generated]
TIME_ZONE=Africa/Nairobi
ALLOWED_HOSTS=your-backend-url.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

#### Frontend Service
```
VITE_API_URL=https://your-backend-url.onrender.com
NODE_ENV=production
```

## 📋 Deployment Checklist

### Pre-Deployment
- ✅ Code pushed to GitHub
- ✅ Environment variables configured
- ✅ Database service created
- ✅ Redis service created

### Post-Deployment
- ✅ Backend health check: `https://your-backend.onrender.com/api/health/`
- ✅ Frontend loads: `https://your-frontend.onrender.com`
- ✅ API docs accessible: `https://your-backend.onrender.com/api/docs/`
- ✅ Admin panel works: `https://your-backend.onrender.com/admin/`

## 🔧 Services Configuration

### Backend (Web Service)
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn civicAI.wsgi:application`
- **Environment**: Python 3.11
- **Instance Type**: Free (for demo) or Starter (for production)

### Frontend (Web Service)
- **Build Command**: `cd frontend && npm ci && npm run build`
- **Start Command**: `cd frontend && npm run start`
- **Environment**: Node 18
- **Instance Type**: Free (for demo) or Starter (for production)

### Database (PostgreSQL)
- **Name**: civicai-db
- **Database**: civicai_production
- **User**: civicai_user
- **Plan**: Free (1GB) or paid for production

### Cache (Redis)
- **Name**: civicai-redis
- **Plan**: Free (256MB) or paid for production

## 🌐 URLs After Deployment

Your services will be available at:
- **Backend API**: `https://civicai-backend.onrender.com`
- **Frontend**: `https://civicai-frontend.onrender.com`
- **API Docs**: `https://civicai-backend.onrender.com/api/docs/`
- **Admin**: `https://civicai-backend.onrender.com/admin/`

## 🔍 Monitoring

### Health Checks
- **Main Health**: `GET /api/health/`
- **System Health**: `GET /api/health/system/`
- **AI Health**: `GET /api/ai/health/`

### Logs
- View in Render.com dashboard
- Structured JSON logs with timestamps
- Separate logs for users, AI, and system events

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Render dashboard
   - Verify `requirements.txt` is complete
   - Ensure `build.sh` is executable

2. **Database Connection Error**
   - Verify `DATABASE_URL` is set correctly
   - Check PostgreSQL service status
   - Ensure migrations completed

3. **Static Files Not Loading**
   - Check `collectstatic` ran successfully
   - Verify WhiteNoise configuration
   - Check `STATIC_ROOT` setting

4. **CORS Errors**
   - Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
   - Check frontend `VITE_API_URL` points to backend
   - Ensure both services are using HTTPS

5. **Frontend Build Fails**
   - Check Node.js version compatibility
   - Verify `package.json` scripts
   - Check for missing dependencies

### Debug Commands
```bash
# Check service status
curl https://your-backend.onrender.com/api/health/

# Test API endpoint
curl https://your-backend.onrender.com/api/locations/counties/

# Check frontend
curl https://your-frontend.onrender.com
```

## 💰 Cost Estimation

### Free Tier (Development/Demo)
- Backend: Free (750 hours/month)
- Frontend: Free (750 hours/month)
- PostgreSQL: Free (1GB)
- Redis: Free (256MB)
- **Total**: $0/month

### Production Tier
- Backend: Starter ($7/month)
- Frontend: Starter ($7/month)
- PostgreSQL: Starter ($7/month)
- Redis: Starter ($7/month)
- **Total**: $28/month

## 🔄 Updates & Maintenance

### Automatic Updates
- Push to main branch triggers redeployment
- Database migrations run automatically
- Static files collected automatically

### Manual Tasks
- Monitor service health
- Review logs for errors
- Update environment variables as needed
- Scale services based on usage

## 📞 Support

- **Render.com Docs**: https://render.com/docs
- **CivicAI Issues**: Create GitHub issues
- **API Documentation**: Available at `/api/docs/`

---

**Ready to Deploy**: Your CivicAI application is now production-ready for Render.com deployment!