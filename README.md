# 🎓 AiCourse - AI-Powered Course Generator

An intelligent course generation platform that uses AI to create comprehensive educational content automatically. Built with React, Node.js, and Google's Generative AI.

![AiCourse](https://firebasestorage.googleapis.com/v0/b/aicourse-81b42.appspot.com/o/aicouse.png?alt=media&token=7175cdbe-64b4-4fe4-bb6d-b519347ad8af)

## ✨ Features

### 🤖 AI-Powered Content Generation
- **Automated Course Creation**: Generate complete courses using Google's Gemini AI
- **Smart Content Structure**: AI creates organized lessons, topics, and subtopics
- **Multi-Language Support**: Generate courses in different languages
- **Rich Media Integration**: Automatic image and video suggestions

### 📚 Course Management
- **Interactive Course Builder**: Create, edit, and manage courses
- **Progress Tracking**: Monitor learning progress and completion
- **Certificate Generation**: Automated certificate creation upon completion
- **Course Sharing**: Share courses with shareable links
- **Notes & Annotations**: Take and save notes during learning

### 💳 Payment Integration
- **Multiple Payment Gateways**: Stripe, PayPal, Razorpay, Paystack, Flutterwave
- **Subscription Management**: Monthly and yearly plans
- **Free Tier Available**: Basic features without payment

### 🔐 Authentication & Security
- **Social Login**: Google and Facebook authentication
- **Email Authentication**: Traditional email/password login
- **Password Recovery**: Secure password reset functionality
- **User Profiles**: Customizable user profiles and preferences

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching capability
- **Rich Text Editor**: TipTap-based content editor
- **Interactive Components**: Built with Radix UI components

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Google Generative AI** - AI content generation
- **Nodemailer** - Email functionality
- **JWT** - Authentication tokens

### APIs & Services
- **Google Gemini AI** - Course content generation
- **Unsplash API** - Course cover images
- **YouTube API** - Video content integration
- **Multiple Payment APIs** - Stripe, PayPal, etc.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** database
- **Google AI API** key

## 🛠️ Installation & Setup

### 🚀 Quick Start (Recommended)

#### Option 1: Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aicourse.git
   cd aicourse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   ```
   
   Fill in your API keys and configuration in `server/.env`. See [Environment Variables](#-environment-variables) section below.

4. **Start the application**
   ```bash
   npm run dev:full
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5010

#### Option 2: Docker Deployment
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aicourse.git
   cd aicourse
   ```

2. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   ```
   
   Fill in your API keys and configuration in `server/.env`.

3. **Start with Docker**
   ```bash
   npm run docker:up
   ```

4. **Access the application**
   - Application: http://localhost:5010
   - Health Check: http://localhost:5010/health

## 📁 Project Structure

```
aicourse/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── constants.tsx      # App configuration
├── server/                # Backend Node.js application
│   ├── server.js          # Main server file
│   ├── .env.example       # Environment variables template
│   └── package.json       # Server dependencies
├── public/                # Static assets
├── .gitignore            # Git ignore rules
├── package.json          # Frontend dependencies
├── README.md             # This file
└── SETUP.md              # Detailed setup guide
```

## 🎯 Available Scripts

### Local Development
- `npm run dev:full` - Start both frontend and backend concurrently
- `npm run dev:clean` - Clean ports and start development (recommended)
- `npm run dev` - Start frontend only (Vite dev server)
- `npm run server` - Start backend only
- `npm run server:dev` - Start backend in development mode
- `npm run build` - Build frontend for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Docker Commands

#### Local Development
- `npm run docker:up` - Build and start (foreground) → http://localhost:5010
- `npm run docker:up:detached` - Build and start (background)
- `npm run docker:down` - Stop and remove containers

#### Docker Hub Deployment
- `npm run docker:build:push` - Build and push to Docker Hub
- `npm run docker:build:production` - Build production image
- `npm run docker:deploy:production` - Deploy on server from Docker Hub
- `npm run docker:up:hub` - Run from Docker Hub image

#### General Commands
- `npm run docker:build` - Build Docker images only
- `npm run docker:logs` - View container logs
- `npm run docker:restart` - Restart containers
- `npm run health` - Check application health status

## 🐳 Docker Deployment

### Prerequisites for Docker
- **Docker** (v20.0 or higher)
- **Docker Compose** (v2.0 or higher)

### Docker Commands Reference

```bash
# Start the application (builds if needed)
npm run docker:up

# Start in background (detached mode)
npm run docker:up:detached

# Stop the application
npm run docker:down

# View logs
npm run docker:logs

# Restart containers
npm run docker:restart

# Check health
npm run health
```

### Docker Configuration
- **Single container** for simplicity
- **Multi-stage build** for optimized production images
- **Health checks** for container monitoring
- **Volume mounting** for persistent logs
- **Port mapping**: 5010:5010
- **Docker Hub integration** for easy deployment

### Docker Environment
- **Base Image**: `node:20-alpine`
- **Working Directory**: `/app`
- **Exposed Port**: `5010`
- **Health Check**: `/health` endpoint
- **User**: Non-root user (`appuser`) for security

## 🔧 Configuration

### Frontend Configuration
Edit `src/constants.tsx` to configure:
- API endpoints
- Payment gateway settings
- Social login credentials
- Pricing plans
- Branding elements

### Backend Configuration
Edit `server/.env` to configure:
- Database connection
- API keys
- Email settings
- Payment gateway credentials

## 💰 Pricing Plans

- **Free Plan**: Basic course generation (limited)
- **Monthly Plan**: $9/month - Full features
- **Yearly Plan**: $99/year - Full features with discount

## 🔐 Environment Variables

Key environment variables needed:

```env
# Required
MONGODB_URI=your_mongodb_connection_string
API_KEY=your_google_ai_api_key
EMAIL=your_gmail_address
PASSWORD=your_gmail_app_password

# Optional (for full functionality)
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

See [SETUP.md](SETUP.md) for complete configuration guide.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

- 🚀 **[Development Guide](DEVELOPMENT.md)** - Quick start for developers
- 🐳 **[Docker Guide](DOCKER.md)** - Docker deployment instructions
- 🔧 **[Setup Guide](SETUP.md)** - Detailed configuration guide

## 🆘 Support

- 📧 Email: spacester.app@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/aicourse/issues)
- 📖 Documentation: See guides above

## 🙏 Acknowledgments

- **Google Generative AI** for powerful content generation
- **Radix UI** for accessible components
- **Tailwind CSS** for styling system
- **Unsplash** for beautiful course images

---

Made with ❤️ by [Spacester](https://github.com/spacester)