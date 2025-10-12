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

## 🛠️ Installation

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
   
   Fill in your API keys and configuration in `server/.env`. See [SETUP.md](SETUP.md) for detailed instructions.

4. **Start the application**
   ```bash
   npm run dev:full
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5010

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

- `npm run dev:full` - Start both frontend and backend
- `npm run dev` - Start frontend only
- `npm run server` - Start backend only
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

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

## 🆘 Support

- 📧 Email: spacester.app@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/aicourse/issues)
- 📖 Documentation: [SETUP.md](SETUP.md)

## 🙏 Acknowledgments

- **Google Generative AI** for powerful content generation
- **Radix UI** for accessible components
- **Tailwind CSS** for styling system
- **Unsplash** for beautiful course images

---

Made with ❤️ by [Spacester](https://github.com/spacester)