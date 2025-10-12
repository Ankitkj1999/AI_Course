# ❓ Frequently Asked Questions

Common questions and answers about AiCourse.

## General Questions

### What is AiCourse?

AiCourse is an AI-powered educational platform that automatically generates comprehensive courses on any topic using Google's Generative AI. It helps educators, trainers, and learners create structured learning content quickly and efficiently.

### What makes AiCourse different?

- **AI-Powered Generation**: Creates complete courses with lessons, examples, and exercises
- **Multi-Language Support**: Generate courses in different languages
- **Interactive Learning**: Built-in progress tracking and certificates
- **Multiple Payment Options**: Supports 5+ payment gateways globally
- **Open Source**: Fully customizable and self-hostable

### Is AiCourse free to use?

AiCourse offers multiple pricing tiers:
- **Free Plan**: Limited course generation (great for testing)
- **Monthly Plan**: $9/month - Unlimited course generation
- **Yearly Plan**: $99/year - Unlimited with discount

## Technical Questions

### What technologies does AiCourse use?

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI for components
- Vite for building

**Backend:**
- Node.js with Express
- MongoDB for database
- Google Generative AI for content
- Multiple payment gateway integrations

### What are the system requirements?

**Development:**
- Node.js v16+ 
- npm v7+
- 4GB RAM minimum
- MongoDB database

**Production:**
- 2GB RAM minimum
- SSL certificate
- Domain name
- Cloud database recommended

### Can I self-host AiCourse?

Yes! AiCourse is designed to be self-hosted. You can:
- Deploy on your own servers
- Use cloud platforms (AWS, Google Cloud, etc.)
- Customize branding and features
- Control your data completely

## Setup & Installation

### How long does setup take?

- **Quick Start**: 5 minutes with basic features
- **Full Setup**: 30 minutes with all integrations
- **Production Deploy**: 1-2 hours including domain setup

### What API keys do I need?

**Required:**
- Google AI API key (for course generation)
- MongoDB connection (for database)
- Gmail app password (for emails)

**Optional:**
- Unsplash API (for course images)
- Payment gateway keys (Stripe, PayPal, etc.)
- Social login credentials (Google, Facebook)

### Can I use a different AI service?

Currently, AiCourse is built specifically for Google's Generative AI (Gemini). However, the code is modular and can be adapted for other AI services like:
- OpenAI GPT
- Anthropic Claude
- Azure OpenAI

### Do I need technical knowledge to set up AiCourse?

Basic technical knowledge is helpful, but our documentation provides step-by-step instructions. You should be comfortable with:
- Command line basics
- Environment variables
- API key management

## Features & Usage

### How does AI course generation work?

1. **User Input**: Provide a topic (e.g., "JavaScript Basics")
2. **AI Processing**: Google's Gemini AI creates structured content
3. **Content Generation**: Lessons, examples, exercises are generated
4. **Media Integration**: Relevant images and videos are added
5. **Course Creation**: Complete course is saved and ready

### What types of courses can I generate?

AiCourse can generate courses on virtually any topic:
- **Programming**: JavaScript, Python, React, etc.
- **Business**: Marketing, Management, Finance
- **Creative**: Design, Writing, Photography
- **Academic**: Math, Science, History
- **Skills**: Communication, Leadership, etc.

### Can I edit generated courses?

Yes! Generated courses are fully editable:
- Modify lesson content
- Add/remove sections
- Insert custom media
- Adjust course structure
- Save multiple versions

### How accurate is the AI-generated content?

The AI generates high-quality educational content, but we recommend:
- Reviewing generated content for accuracy
- Adding your expertise and examples
- Fact-checking technical information
- Customizing for your audience

### Can students track their progress?

Yes, AiCourse includes:
- Progress tracking per lesson
- Course completion status
- Automatic certificate generation
- Notes and bookmarking
- Learning analytics

## Payment & Subscriptions

### What payment methods are supported?

AiCourse supports multiple payment gateways:
- **Stripe** (Global - Cards, Apple Pay, Google Pay)
- **PayPal** (Global - PayPal accounts, cards)
- **Razorpay** (India - UPI, cards, wallets)
- **Paystack** (Africa - Cards, bank transfers)
- **Flutterwave** (Africa - Multiple local methods)

### Can I disable payment features?

Yes! You can:
- Run completely free (no payments)
- Enable only specific payment gateways
- Customize pricing plans
- Add your own payment methods

### How do subscriptions work?

- **Monthly**: $9/month, cancel anytime
- **Yearly**: $99/year (save $9)
- **Automatic renewal** with email notifications
- **Cancel anytime** through user dashboard

### Can I offer custom pricing?

Yes, you can customize:
- Plan names and descriptions
- Pricing amounts
- Billing cycles
- Feature limitations
- Trial periods

## Customization & Branding

### Can I customize the appearance?

Absolutely! You can customize:
- **Colors**: Tailwind CSS classes
- **Logo**: Replace in constants file
- **Branding**: Company name, taglines
- **Layout**: Modify React components
- **Styling**: Full CSS control

### How do I change the app name and branding?

Edit `src/constants.tsx`:
```typescript
export const appName = 'Your App Name';
export const companyName = 'Your Company';
export const appLogo = 'https://your-logo-url.com';
```

### Can I add custom features?

Yes! The codebase is modular and extensible:
- Add new API endpoints
- Create custom React components
- Integrate additional services
- Modify database schemas
- Add new payment gateways

## Deployment & Hosting

### Where can I deploy AiCourse?

**Cloud Platforms:**
- Vercel (frontend) + Railway (backend)
- Netlify (frontend) + Heroku (backend)
- AWS (full stack)
- Google Cloud Platform
- DigitalOcean

**Self-Hosted:**
- VPS servers
- Dedicated servers
- Docker containers
- Kubernetes clusters

### Do you provide hosting?

Currently, AiCourse is self-hosted. However, we provide:
- Detailed deployment guides
- Docker configurations
- Cloud platform tutorials
- Community support

### What about SSL certificates?

For production deployment, you'll need:
- SSL certificate (Let's Encrypt is free)
- Domain name
- HTTPS configuration
- Secure environment variables

## Support & Community

### How do I get help?

**Documentation:**
- [Installation Guide](installation.md)
- [Troubleshooting Guide](troubleshooting.md)
- [API Reference](api-reference.md)

**Community:**
- GitHub Issues
- Discord community
- Stack Overflow

**Direct Support:**
- Email: spacester.app@gmail.com
- Priority support for subscribers

### Can I contribute to AiCourse?

Yes! We welcome contributions:
- Bug fixes and improvements
- New features
- Documentation updates
- Translation support
- Community support

### Is there a roadmap?

Upcoming features include:
- More AI model integrations
- Advanced analytics
- Mobile app
- Collaborative editing
- LMS integrations
- White-label solutions

## Security & Privacy

### Is my data secure?

AiCourse implements security best practices:
- Encrypted database connections
- Secure API key storage
- HTTPS in production
- Input validation and sanitization
- Regular security updates

### Who owns the generated content?

You own all content generated through your AiCourse instance:
- Generated courses belong to you
- User data stays in your database
- No content is shared with third parties
- Full data export capabilities

### Can I backup my data?

Yes, you have full control:
- MongoDB database backups
- Export user data
- Download generated courses
- Backup environment configurations

## Licensing & Legal

### What license does AiCourse use?

AiCourse is released under the MIT License, which means:
- Free for personal and commercial use
- Modify and distribute freely
- No warranty or liability
- Attribution required

### Can I sell courses created with AiCourse?

Yes! You can:
- Sell generated courses
- Use for commercial training
- Create educational products
- Build course marketplaces
- Offer as a service

### Are there any usage restrictions?

The only restrictions are:
- Comply with AI service terms (Google AI)
- Follow payment gateway policies
- Respect third-party API limits
- Use responsibly and ethically

## Still Have Questions?

Can't find what you're looking for?

- 📧 **Email**: spacester.app@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/aicourse/issues)
- 📖 **Docs**: Check our [documentation](README.md)
- 💬 **Community**: Join our Discord server

We're here to help! 🚀