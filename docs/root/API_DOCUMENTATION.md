# Carbon Intelligence API Documentation

## Overview

The Carbon Intelligence API provides comprehensive endpoints for carbon footprint tracking, sustainability analytics, and MSME management. Built with Node.js and Express, it offers RESTful services with real-time WebSocket support.

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.carbonintelligence.com/api
```

## Authentication

All API endpoints (except public ones) require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### Authentication

#### POST /auth/register
Register a new MSME user.

**Request Body:**
```json
{
  "email": "company@example.com",
  "password": "securePassword123",
  "companyName": "Eco Manufacturing Ltd",
  "industry": "Manufacturing",
  "companySize": "50-100",
  "location": "New York, NY",
  "contactPerson": "John Doe",
  "phoneNumber": "+1-555-0123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a1b2c3d4e5f6789abcdef0",
      "email": "company@example.com",
      "companyName": "Eco Manufacturing Ltd",
      "industry": "Manufacturing",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "company@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a1b2c3d4e5f6789abcdef0",
      "email": "company@example.com",
      "companyName": "Eco Manufacturing Ltd"
    }
  }
}
```

### Dashboard

#### GET /dashboard
Get dashboard overview data.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentScore": 75,
    "lastAssessmentDate": "2024-01-15T10:30:00Z",
    "currentMonthEmissions": 1250.5,
    "totalTransactions": 45,
    "categoryBreakdown": {
      "energy": {
        "co2Emissions": 500.2,
        "percentage": 40.0
      },
      "water": {
        "co2Emissions": 300.1,
        "percentage": 24.0
      },
      "waste": {
        "co2Emissions": 200.3,
        "percentage": 16.0
      },
      "transportation": {
        "co2Emissions": 150.9,
        "percentage": 12.0
      },
      "materials": {
        "co2Emissions": 99.0,
        "percentage": 8.0
      }
    },
    "recentTransactions": [
      {
        "id": "tx_001",
        "type": "energy",
        "amount": 150.5,
        "date": "2024-01-15T09:00:00Z",
        "description": "Electricity consumption"
      }
    ],
    "topRecommendations": [
      {
        "id": "rec_001",
        "title": "Switch to LED lighting",
        "description": "Replace traditional bulbs with LED lights",
        "potentialSavings": 25.5,
        "priority": "high"
      }
    ]
  }
}
```

### Carbon Footprint

#### GET /carbon-footprint
Get detailed carbon footprint data.

**Query Parameters:**
- `startDate` (optional): Start date for data range (ISO 8601)
- `endDate` (optional): End date for data range (ISO 8601)
- `category` (optional): Filter by category (energy, water, waste, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEmissions": 1250.5,
    "period": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z"
    },
    "categoryBreakdown": {
      "energy": {
        "emissions": 500.2,
        "percentage": 40.0,
        "trend": "decreasing",
        "change": -5.2
      }
    },
    "monthlyData": [
      {
        "month": "2024-01",
        "emissions": 1250.5,
        "categories": {
          "energy": 500.2,
          "water": 300.1,
          "waste": 200.3,
          "transportation": 150.9,
          "materials": 99.0
        }
      }
    ],
    "recommendations": [
      {
        "id": "rec_001",
        "category": "energy",
        "title": "Install solar panels",
        "description": "Generate renewable energy on-site",
        "potentialSavings": 150.0,
        "implementationCost": 5000.0,
        "paybackPeriod": 33.3,
        "priority": "high"
      }
    ]
  }
}
```

#### POST /carbon-footprint/transaction
Add a new carbon footprint transaction.

**Request Body:**
```json
{
  "type": "energy",
  "amount": 150.5,
  "description": "Electricity consumption for January",
  "date": "2024-01-15T09:00:00Z",
  "category": "energy",
  "subcategory": "electricity",
  "unit": "kWh",
  "conversionFactor": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction added successfully",
  "data": {
    "id": "tx_001",
    "type": "energy",
    "amount": 150.5,
    "co2Emissions": 75.25,
    "date": "2024-01-15T09:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Analytics

#### GET /analytics
Get analytics data and insights.

**Query Parameters:**
- `startDate` (required): Start date for analysis (ISO 8601)
- `endDate` (required): End date for analysis (ISO 8601)
- `granularity` (optional): Data granularity (daily, weekly, monthly)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z"
    },
    "totalEmissions": 1250.5,
    "averageDailyEmissions": 40.3,
    "trends": {
      "overall": "decreasing",
      "change": -8.5,
      "changePercentage": -6.7
    },
    "charts": {
      "emissionsOverTime": [
        {
          "date": "2024-01-01",
          "emissions": 45.2,
          "categories": {
            "energy": 18.1,
            "water": 10.8,
            "waste": 7.2,
            "transportation": 5.4,
            "materials": 3.7
          }
        }
      ],
      "categoryDistribution": {
        "energy": 40.0,
        "water": 24.0,
        "waste": 16.0,
        "transportation": 12.0,
        "materials": 8.0
      }
    },
    "insights": [
      {
        "type": "trend",
        "title": "Energy consumption decreasing",
        "description": "Your energy consumption has decreased by 12% this month",
        "impact": "positive",
        "confidence": 0.85
      },
      {
        "type": "anomaly",
        "title": "Unusual waste generation spike",
        "description": "Waste generation increased by 25% on January 20th",
        "impact": "negative",
        "confidence": 0.92
      }
    ],
    "benchmarks": {
      "industryAverage": 1500.0,
      "yourPerformance": 1250.5,
      "percentile": 75,
      "comparison": "better"
    }
  }
}
```

### SMS Analysis

#### POST /sms/analyze
Analyze SMS messages for carbon footprint insights.

**Request Body:**
```json
{
  "messages": [
    {
      "id": "msg_001",
      "sender": "+1-555-0123",
      "content": "Electricity bill received: $450 for 900 kWh",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 1,
    "processedMessages": 1,
    "insights": [
      {
        "type": "energy_consumption",
        "confidence": 0.95,
        "data": {
          "consumption": 900,
          "unit": "kWh",
          "cost": 450,
          "currency": "USD",
          "estimatedEmissions": 450.0
        },
        "messageId": "msg_001"
      }
    ],
    "transactions": [
      {
        "type": "energy",
        "amount": 900,
        "unit": "kWh",
        "co2Emissions": 450.0,
        "description": "Electricity consumption from SMS analysis",
        "date": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Email Analysis

#### POST /email/analyze
Analyze email messages for carbon footprint insights.

**Request Body:**
```json
{
  "emails": [
    {
      "id": "email_001",
      "subject": "Monthly Energy Report",
      "content": "Your energy consumption this month was 1200 kWh, resulting in 600 kg CO2 emissions.",
      "timestamp": "2024-01-15T10:30:00Z",
      "sender": "energy@utility.com"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEmails": 1,
    "processedEmails": 1,
    "insights": [
      {
        "type": "energy_report",
        "confidence": 0.98,
        "data": {
          "consumption": 1200,
          "unit": "kWh",
          "emissions": 600,
          "emissionsUnit": "kg CO2"
        },
        "emailId": "email_001"
      }
    ],
    "transactions": [
      {
        "type": "energy",
        "amount": 1200,
        "unit": "kWh",
        "co2Emissions": 600.0,
        "description": "Energy consumption from email analysis",
        "date": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Incentives

#### GET /incentives
Get available incentives and rewards.

**Response:**
```json
{
  "success": true,
  "data": {
    "availableIncentives": [
      {
        "id": "inc_001",
        "title": "Energy Efficiency Grant",
        "description": "Government grant for energy efficiency improvements",
        "amount": 5000,
        "currency": "USD",
        "requirements": {
          "minEmissionsReduction": 10,
          "maxCompanySize": 100
        },
        "expiryDate": "2024-12-31T23:59:59Z",
        "status": "available"
      }
    ],
    "userEligible": [
      "inc_001"
    ],
    "userRewards": [
      {
        "id": "reward_001",
        "title": "Carbon Reduction Achievement",
        "description": "Reduced emissions by 15% this month",
        "points": 150,
        "dateEarned": "2024-01-15T10:30:00Z"
      }
    ],
    "totalPoints": 150,
    "nextMilestone": {
      "points": 200,
      "reward": "Premium Analytics Access"
    }
  }
}
```

### Reporting

#### GET /reports
Get sustainability reports.

**Query Parameters:**
- `type` (optional): Report type (monthly, quarterly, annual)
- `year` (optional): Year for the report
- `month` (optional): Month for the report (1-12)

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "rpt_001",
    "type": "monthly",
    "period": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z"
    },
    "summary": {
      "totalEmissions": 1250.5,
      "emissionsReduction": 8.5,
      "reductionPercentage": 6.7,
      "score": 75
    },
    "sections": [
      {
        "title": "Executive Summary",
        "content": "Your company has achieved a 6.7% reduction in carbon emissions this month..."
      },
      {
        "title": "Energy Consumption",
        "content": "Energy consumption decreased by 12% compared to last month..."
      }
    ],
    "charts": [
      {
        "type": "emissions_trend",
        "title": "Monthly Emissions Trend",
        "data": "base64_encoded_chart_data"
      }
    ],
    "recommendations": [
      {
        "priority": "high",
        "title": "Install solar panels",
        "description": "Generate renewable energy on-site",
        "potentialSavings": 150.0
      }
    ],
    "generatedAt": "2024-01-31T23:59:59Z"
  }
}
```

#### POST /reports/generate
Generate a new sustainability report.

**Request Body:**
```json
{
  "type": "monthly",
  "year": 2024,
  "month": 1,
  "includeCharts": true,
  "includeRecommendations": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "reportId": "rpt_001",
    "downloadUrl": "https://api.carbonintelligence.com/reports/rpt_001/download",
    "expiresAt": "2024-02-15T23:59:59Z"
  }
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### real-time-emissions
Emitted when new emission data is available.

```json
{
  "type": "real-time-emissions",
  "data": {
    "category": "energy",
    "amount": 150.5,
    "co2Emissions": 75.25,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### recommendation-update
Emitted when new recommendations are available.

```json
{
  "type": "recommendation-update",
  "data": {
    "recommendations": [
      {
        "id": "rec_001",
        "title": "Switch to LED lighting",
        "priority": "high"
      }
    ]
  }
}
```

#### alert
Emitted when important alerts need attention.

```json
{
  "type": "alert",
  "data": {
    "level": "warning",
    "title": "High Energy Consumption",
    "message": "Energy consumption is 20% higher than usual",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Data endpoints**: 100 requests per minute
- **Analysis endpoints**: 10 requests per minute
- **Report generation**: 5 requests per hour

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.carbonintelligence.com/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get dashboard data
const dashboard = await api.get('/dashboard');

// Add transaction
const transaction = await api.post('/carbon-footprint/transaction', {
  type: 'energy',
  amount: 150.5,
  description: 'Electricity consumption'
});
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get dashboard data
response = requests.get(
    'https://api.carbonintelligence.com/api/dashboard',
    headers=headers
)
dashboard = response.json()
```

## Support

For API support and questions:
- **Email**: api-support@carbonintelligence.com
- **Documentation**: https://docs.carbonintelligence.com/api
- **Status Page**: https://status.carbonintelligence.com