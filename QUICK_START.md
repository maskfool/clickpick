# 🚀 ClickPick Quick Start Guide

Get ClickPick running on your machine in under 5 minutes!

## ⚡ Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Make setup script executable and run it
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup
```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Set up environment files
cp backend/env.example backend/.env
echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
```

## 🔧 Environment Configuration

### Backend (.env)
```bash
cd backend
nano .env
```

**Required variables:**
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/clickpick

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

### Frontend (.env)
```bash
cd frontend
nano .env
```

**Required variables:**
```env
VITE_API_URL=http://localhost:5000/api
```

## 🗄️ Database Setup

### MongoDB
```bash
# Start MongoDB locally
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### Redis
```bash
# Start Redis locally
redis-server

# Or use Redis Cloud (cloud)
# Update REDIS_URL in backend/.env
```

## 🚀 Start Development

### Start Both Services
```bash
# From root directory
npm run dev
```

### Start Individually
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## 🌐 Access Your App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🧪 Test the Setup

1. Open http://localhost:5173 in your browser
2. Click "Get Started" to register
3. Use any email/password for testing
4. Navigate to Dashboard after login

## 🔑 Testing Credentials

For development, you can use:
- **Email**: test@clickpick.app
- **Password**: password123

## 📱 Features Available

✅ **Authentication System**
- User registration and login
- JWT-based authentication
- Protected routes

✅ **Responsive UI**
- Modern design with Tailwind CSS
- Dark/light theme toggle
- Mobile-friendly layout

✅ **Backend API**
- RESTful API endpoints
- User management
- File upload handling
- AI service integration

✅ **Database Models**
- User management
- Thumbnail storage
- Image metadata

## 🚧 Coming Soon

- AI thumbnail generation
- Image editing with natural language
- Thumbnail gallery and management
- Performance analytics
- Advanced AI features

## 🆘 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Kill process using port 5173
lsof -ti:5173 | xargs kill -9
```

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb
# Start MongoDB
brew services start mongodb-community
```

**Redis connection failed:**
```bash
# Check if Redis is running
brew services list | grep redis
# Start Redis
brew services start redis
```

**Node modules issues:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Still Having Issues?

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB and Redis are running
4. Check if ports 5000 and 5173 are available
5. Review the detailed README.md

## 📚 Next Steps

1. **Explore the Codebase**
   - Check `backend/src/` for API structure
   - Review `frontend/src/` for React components
   - Understand the database models

2. **Add AI Integration**
   - Get OpenAI API key
   - Get Google AI API key
   - Test AI services

3. **Customize the App**
   - Modify the design in `frontend/src/index.css`
   - Add new API endpoints in `backend/src/routes/`
   - Create new React components

4. **Deploy to Production**
   - Set up MongoDB Atlas
   - Configure Redis Cloud
   - Deploy backend to Render
   - Deploy frontend to Vercel

## 🎯 Development Workflow

```bash
# 1. Start development
npm run dev

# 2. Make changes to code
# 3. Save files (auto-reload enabled)
# 4. Test in browser
# 5. Commit changes
git add .
git commit -m "Add new feature"
git push
```

## 🎉 You're All Set!

ClickPick is now running on your machine. Start exploring the codebase and building amazing features!

---

**Need help?** Check the main [README.md](README.md) for detailed documentation.
