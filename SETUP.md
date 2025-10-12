# AiCourse Setup Guide

## Environment Variables Setup

1. Copy the example environment file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Fill in the required values in `server/.env`:

### Required Configuration

#### Database
- **MONGODB_URI**: MongoDB connection string
  - Get from [MongoDB Atlas](https://www.mongodb.com/atlas)
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

#### Google AI API
- **API_KEY**: Google Generative AI API key
  - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Email (Gmail SMTP)
- **EMAIL**: Your Gmail address
- **PASSWORD**: Gmail App Password (not your regular password)
  - Enable 2FA on Gmail
  - Generate App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)

### Optional Payment Integrations

#### PayPal
- **PAYPAL_CLIENT_ID** & **PAYPAL_APP_SECRET_KEY**
  - Get from [PayPal Developer](https://developer.paypal.com/)

#### Stripe
- **STRIPE_SECRET_KEY**
  - Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

#### Razorpay
- **RAZORPAY_KEY_ID** & **RAZORPAY_KEY_SECRET**
  - Get from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)

#### Paystack
- **PAYSTACK_SECRET_KEY**
  - Get from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers)

#### Flutterwave
- **FLUTTERWAVE_PUBLIC_KEY** & **FLUTTERWAVE_SECRET_KEY**
  - Get from [Flutterwave Dashboard](https://dashboard.flutterwave.com/settings/apis)

### Other Services

#### Unsplash (for course images)
- **UNSPLASH_ACCESS_KEY**
  - Get from [Unsplash Developers](https://unsplash.com/developers)

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start both frontend and backend:
   ```bash
   npm run dev:full
   ```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5010

## Notes

- The application will work with minimal configuration (MongoDB + Google AI API)
- Payment integrations are optional and can be enabled/disabled in the frontend constants
- Make sure to never commit your actual `.env` file to version control