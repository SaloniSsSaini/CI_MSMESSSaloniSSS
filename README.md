# Carbon Intelligence - MSME Carbon Footprint Platform

A comprehensive mobile application and backend platform that reads SMS messages and emails to analyze transactions and measure carbon footprint for MSME (Micro, Small, and Medium Enterprises) in terms of sustainable manufacturing.

## 🌱 Overview

Carbon Intelligence is a complete solution that enables MSME companies to:
- **Automatically analyze SMS and email transactions** for carbon footprint calculation
- **Track sustainability metrics** across all manufacturing processes
- **Receive personalized recommendations** for sustainable manufacturing practices
- **Monitor environmental impact** and progress over time
- **Generate detailed analytics** and insights

## 🏗️ Architecture

### Backend (Node.js/Express)
- **RESTful API** for data processing and analysis
- **MongoDB** for data storage
- **SMS & Email Processing** with NLP and machine learning
- **Carbon Footprint Calculation** algorithms
- **Real-time Analytics** and reporting

### Mobile App (React Native)
- **Cross-platform** iOS and Android support
- **Intuitive UI** for data visualization
- **Real-time sync** with backend
- **Offline capabilities** for critical functions
- **Push notifications** for insights and recommendations

## ✨ Key Features

### 📱 Mobile Application
- **Dashboard** with carbon score and key metrics
- **Transaction Management** with SMS/email analysis
- **Carbon Footprint Tracking** with detailed breakdowns
- **Analytics & Insights** with charts and trends
- **Recommendations Engine** for sustainability improvements
- **Profile Management** and settings

### 🔧 Backend Services
- **SMS Processing** with transaction extraction
- **Email Analysis** with content parsing
- **Carbon Calculation** using industry-standard emission factors
- **Analytics Engine** for insights and trends
- **Recommendation System** for sustainability improvements
- **User Management** and authentication

### 📊 Carbon Footprint Calculation
- **Energy Consumption** (Electricity & Fuel)
- **Water Usage** and treatment impact
- **Waste Management** and recycling
- **Transportation** emissions
- **Raw Materials** sourcing impact
- **Manufacturing Process** efficiency
- **Environmental Controls** assessment

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- React Native development environment
- Android Studio / Xcode (for mobile development)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000`

### Mobile App Setup

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Start Metro bundler**
   ```bash
   npm start
   ```

5. **Run on Android**
   ```bash
   npm run android
   ```

6. **Run on iOS**
   ```bash
   npm run ios
   ```

## 📁 Project Structure

```
carbon-intelligence/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   └── package.json
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── services/       # API services
│   │   ├── theme/          # App theme and styling
│   │   └── context/        # React context providers
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### SMS Processing
- `POST /api/sms/process` - Process single SMS
- `POST /api/sms/bulk-process` - Process multiple SMS
- `GET /api/sms/transactions` - Get SMS transactions
- `GET /api/sms/analytics` - Get SMS analytics

### Email Processing
- `POST /api/email/process` - Process single email
- `POST /api/email/bulk-process` - Process multiple emails
- `GET /api/email/transactions` - Get email transactions
- `GET /api/email/analytics` - Get email analytics

### Carbon Footprint
- `POST /api/carbon/assess` - Perform carbon assessment
- `GET /api/carbon/assessments` - Get carbon assessments
- `GET /api/carbon/dashboard` - Get carbon dashboard data

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/trends` - Get trend analytics
- `GET /api/analytics/insights` - Get insights and recommendations

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Mobile App Testing
```bash
cd mobile
npm test
```

## 📱 Mobile App Features

### Dashboard
- Carbon score visualization
- Key metrics overview
- Recent transactions
- Quick actions

### Transaction Management
- SMS and email analysis
- Manual transaction entry
- Category classification
- Carbon footprint calculation

### Carbon Footprint Tracking
- Detailed emission breakdown
- Category-wise analysis
- Trend visualization
- Recommendations

### Analytics
- Interactive charts
- Trend analysis
- Insights and recommendations
- Export capabilities

## 🔒 Security Features

- **JWT Authentication** for secure API access
- **Data Encryption** for sensitive information
- **Input Validation** and sanitization
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests

## 🌍 Environmental Impact

This platform helps MSME companies:
- **Reduce Carbon Footprint** through data-driven insights
- **Improve Sustainability** with actionable recommendations
- **Comply with Regulations** through environmental tracking
- **Save Costs** through efficiency improvements
- **Enhance Brand Value** through sustainability initiatives

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🚀 Future Enhancements

- **Machine Learning** for better transaction classification
- **IoT Integration** for real-time data collection
- **Blockchain** for carbon credit trading
- **Advanced Analytics** with predictive modeling
- **Multi-language Support**
- **Integration** with government databases
- **Automated Reporting** for compliance

---

**Built with ❤️ for a sustainable future**

*Helping MSME companies measure, track, and reduce their carbon footprint through intelligent transaction analysis and sustainable manufacturing recommendations.*