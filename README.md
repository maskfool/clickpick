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

## 📁 Project Structure

```
clickpick/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database and configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic and external APIs
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── env.example
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── main.tsx        # App entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Database Management

```bash
# MongoDB shell
mongosh

# Redis CLI
redis-cli

# View collections
use clickpick
show collections

# View users
db.users.find()
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Backend Deployment (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

### Environment Variables for Production

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=your-production-mongodb-uri
REDIS_URL=your-production-redis-url
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## 🔐 Authentication

The application uses JWT-based authentication with the following endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

## 📊 API Endpoints

### Thumbnails
- `POST /api/thumbnails` - Create new thumbnail
- `GET /api/thumbnails/my` - Get user thumbnails
- `GET /api/thumbnails/public` - Get public thumbnails
- `GET /api/thumbnails/:id` - Get thumbnail by ID
- `PUT /api/thumbnails/:id` - Update thumbnail
- `DELETE /api/thumbnails/:id` - Delete thumbnail
- `POST /api/thumbnails/:id/edit` - Edit thumbnail with AI

### Images
- `POST /api/images/upload-photo` - Upload user photo
- `POST /api/images/upload-reference` - Upload reference image
- `POST /api/images/process` - Process and resize image
- `GET /api/images/info/:filename` - Get image info
- `DELETE /api/images/:filename` - Delete image

### Chat/AI
- `POST /api/chat/enhance-prompt` - Enhance prompt with AI
- `POST /api/chat/thumbnail-ideas` - Get thumbnail ideas
- `POST /api/chat/edit-suggestions` - Get editing suggestions
- `POST /api/chat/thumbnail-feedback` - Get thumbnail feedback
- `POST /api/chat/prompt-help` - Get prompt writing help
- `GET /api/chat/trending-topics` - Get trending topics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for general questions
- **Email**: hello@clickpick.app

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 integration
- **Google AI** for Flash 2.5 image generation
- **MongoDB** for the database solution
- **React Team** for the amazing frontend framework
- **Vercel & Render** for hosting solutions

## 📈 Roadmap

- [ ] Advanced AI editing capabilities
- [ ] Batch thumbnail generation
- [ ] A/B testing for thumbnails
- [ ] Analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] API rate limiting and usage tracking
- [ ] Integration with YouTube API
- [ ] Social media sharing
- [ ] Template marketplace

---

**Made with ❤️ for content creators everywhere**

*ClickPick - Transform your thumbnails, transform your channel*
