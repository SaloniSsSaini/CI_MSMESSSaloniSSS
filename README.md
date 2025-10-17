# Carbon Intelligence - MSME Carbon Footprint Measurement

A comprehensive React application designed to help MSME (Micro, Small, and Medium Enterprises) companies measure their carbon footprint and receive personalized sustainable manufacturing recommendations.

## 🌱 Overview

Carbon Intelligence is a digital platform that enables MSME companies to:
- Register with detailed MSME information including Udyog Aadhar, GST, and PAN numbers
- Measure their carbon footprint across all manufacturing processes
- Receive personalized recommendations for sustainable manufacturing practices
- Track their environmental impact and progress over time

## ✨ Features

### MSME Registration
- **Comprehensive Registration Form** with multi-step wizard
- **MSME-Specific Fields**:
  - Udyog Aadhar Number validation
  - GST Number validation
  - PAN Number validation
  - Company type classification (Micro/Small/Medium)
  - Industry categorization
  - Business metrics (turnover, employees, manufacturing units)
- **Form Validation** with real-time error checking
- **Data Persistence** using localStorage

### Carbon Footprint Assessment
- **Multi-Step Assessment Process**:
  1. Energy Consumption (Electricity & Fuel)
  2. Water Usage & Waste Management
  3. Transportation
  4. Raw Materials
  5. Manufacturing Process
  6. Environmental Controls
  7. Results & Analysis
- **Comprehensive Calculations**:
  - Energy-related CO₂ emissions
  - Water consumption impact
  - Waste generation and recycling
  - Transportation emissions
  - Material sourcing impact
  - Manufacturing process efficiency
- **Real-time Carbon Score** calculation
- **Detailed Breakdown** by category

### Sustainable Manufacturing Recommendations
- **Personalized Recommendations** based on company profile
- **Categorized Suggestions**:
  - Energy efficiency improvements
  - Waste management optimization
  - Water conservation measures
  - Green transportation solutions
  - Process optimization
  - Supply chain sustainability
  - Employee engagement programs
- **Implementation Guidance** with step-by-step instructions
- **Financial Impact Analysis**:
  - Estimated annual savings
  - Payback period calculations
  - CO₂ reduction potential
- **Priority-based Filtering** (High/Medium/Low priority)

### Dashboard
- **Company Overview** with key metrics
- **Carbon Score Visualization** with progress indicators
- **Quick Action Cards** for easy navigation
- **Business Metrics Display**:
  - Annual turnover
  - Number of employees
  - Manufacturing units
- **Real-time Status** updates

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carbon-intelligence-msme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run lint` - Runs ESLint for code quality
- `npm run lint:fix` - Fixes ESLint issues automatically

## 🏗️ Project Structure

```
src/
├── components/
│   ├── __tests__/
│   │   ├── MSMERegistration.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── CarbonFootprint.test.tsx
│   │   └── Recommendations.test.tsx
│   ├── MSMERegistration.tsx
│   ├── Dashboard.tsx
│   ├── CarbonFootprint.tsx
│   └── Recommendations.tsx
├── App.tsx
├── index.tsx
└── setupTests.ts
```

## 🧪 Testing

The application includes comprehensive test coverage:

- **Unit Tests** for all components
- **Form Validation Tests** for MSME registration
- **Carbon Footprint Calculation Tests**
- **Recommendation System Tests**
- **Navigation and User Flow Tests**

Run tests with:
```bash
npm test
```

## 📊 Carbon Footprint Calculation

The application uses industry-standard emission factors and calculation methods:

### Energy Consumption
- **Electricity**: Based on grid mix and renewable energy sources
- **Fuel**: Diesel, Petrol, LPG, CNG with respective emission factors

### Water Usage
- **Consumption Impact**: Water treatment and distribution emissions
- **Wastewater Treatment**: Additional processing requirements

### Waste Management
- **Solid Waste**: Landfill decomposition emissions
- **Recycling Impact**: Reduced emissions through recycling
- **Hazardous Waste**: Higher emission factors for hazardous materials

### Transportation
- **Vehicle Fleet**: Distance-based calculations
- **Fuel Efficiency**: Vehicle-specific consumption rates

### Raw Materials
- **Material Types**: Steel, Aluminum, Plastic, Paper, Glass
- **Supplier Distance**: Transportation impact of sourcing

### Manufacturing Process
- **Production Volume**: Scale-based efficiency factors
- **Process Efficiency**: Optimization potential
- **Equipment Age**: Modern vs. legacy equipment impact

## 🎯 MSME Registration Fields

### Company Information
- Company Name
- Company Type (Micro/Small/Medium)
- Industry Category
- Establishment Year

### MSME Registration Details
- **Udyog Aadhar Number** (Format: XX00XX0000)
- **GST Number** (Format: 00XXXXX0000X0X)
- **PAN Number** (Format: XXXXX0000X)

### Contact & Address
- Email Address
- Phone Number
- Complete Address
- City, State, Pincode
- Country

### Business Details
- Annual Turnover
- Number of Employees
- Manufacturing Units
- Primary Products/Services

### Environmental Compliance
- Environmental Clearance Certificate
- Pollution Control Board Registration
- Waste Management System

## 🔧 Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI)
- **Form Management**: React Hook Form with Yup validation
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Testing**: Jest with React Testing Library
- **Build Tool**: Create React App

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices

## 🔒 Data Privacy

- All data is stored locally in the browser
- No external API calls or data transmission
- GDPR-compliant data handling
- User consent for data processing

## 🌍 Environmental Impact

This application helps MSME companies:
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

- **API Integration** for real-time data
- **Advanced Analytics** with historical tracking
- **Mobile App** development
- **Multi-language Support**
- **Integration** with government databases
- **Automated Reporting** for compliance
- **Machine Learning** for better recommendations

---

**Built with ❤️ for a sustainable future**