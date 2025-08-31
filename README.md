# ClickPick - AI-Powered YouTube Thumbnail Maker

ClickPick is a cutting-edge SaaS platform that uses artificial intelligence to generate stunning, click-worthy YouTube thumbnails. Built with modern technologies and designed for content creators who want professional results without the complexity.

## 🚀 Features

- **AI-Powered Generation**: Create thumbnails with advanced AI that understands your content
- **Natural Language Editing**: Make changes by simply describing what you want
- **Category Optimization**: Tailored prompts for different content types (gaming, education, tech, etc.)
- **Real-time Collaboration**: Edit and refine thumbnails with AI assistance
- **High-Resolution Output**: Download thumbnails in multiple formats and sizes
- **Creator Analytics**: Track performance and optimize your thumbnails
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Authentication
- **OpenAI API** - AI prompt enhancement
- **Google AI (Flash 2.5)** - Image generation
- **Multer** - File uploads
- **Sharp** - Image processing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Framer Motion** - Animations

### Infrastructure
- **Vercel** - Frontend deployment
- **Render** - Backend deployment
- **MongoDB Atlas** - Cloud database
- **Redis Cloud** - Cloud caching

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud)
- **Redis** (local or cloud)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/clickpick.git
cd clickpick
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/clickpick

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Google AI (Flash 2.5)
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup

**MongoDB:**
```bash
# Start MongoDB (if running locally)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

**Redis:**
```bash
# Start Redis (if running locally)
redis-server

# Or use Redis Cloud (cloud)
# Update REDIS_URL in .env
```

### 5. Start Development Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Your application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health


*ClickPick - Transform your thumbnails, transform your channel*
