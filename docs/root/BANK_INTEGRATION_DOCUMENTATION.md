# Bank Integration for Green Loans - Documentation

## Overview

This document describes the integration of banks as stakeholders in the Carbon Intelligence MSME platform to provide green loans based on carbon savings and carbon score calculations.

## Features Implemented

### 1. Backend Models

#### Bank Model (`/backend/src/models/Bank.js`)
- Stores bank information and green loan policies
- Includes contact details, loan terms, and eligibility criteria
- Supports carbon score-based interest rate discounts
- Configurable loan amount ranges and tenure options

#### Green Loan Model (`/backend/src/models/GreenLoan.js`)
- Comprehensive loan application tracking
- Carbon assessment integration
- Loan terms calculation with carbon score discounts
- Repayment schedule generation
- Carbon monitoring and compliance tracking

### 2. Backend APIs

#### Bank APIs (`/backend/src/routes/banks.js`)
- `GET /api/banks` - Get all active banks
- `GET /api/banks/:id` - Get specific bank details
- `POST /api/banks` - Create new bank (Admin only)
- `PUT /api/banks/:id` - Update bank details (Admin only)
- `GET /api/banks/:id/loans` - Get loans for a specific bank
- `GET /api/banks/:id/statistics` - Get bank statistics

#### Green Loan APIs (`/backend/src/routes/greenLoans.js`)
- `POST /api/green-loans/eligibility-check` - Check loan eligibility
- `POST /api/green-loans/apply` - Apply for green loan
- `GET /api/green-loans/my-loans` - Get MSME's loan applications
- `GET /api/green-loans/:id` - Get loan details
- `PUT /api/green-loans/:id/status` - Update loan status (Bank only)

### 3. Frontend Components

#### Green Loans Component (`/src/components/GreenLoans.tsx`)
- Comprehensive loan management interface
- Three main tabs:
  - **My Loans**: View and manage existing loan applications
  - **Available Banks**: Browse participating banks and their policies
  - **Loan Calculator**: Check eligibility and calculate loan terms

#### Key Features:
- Real-time eligibility checking based on carbon score
- Dynamic interest rate calculation with carbon score discounts
- Loan application form with validation
- Status tracking and review comments
- Detailed loan information display

### 4. API Service (`/src/services/api.ts`)
- Centralized API communication
- Authentication handling
- Error management
- Type-safe request/response handling

## Loan Eligibility Criteria

### Carbon Score Requirements
- Minimum carbon score varies by bank (60-70)
- Higher scores receive better interest rates
- Carbon score discounts range from 0.5% to 2.5%

### MSME Requirements
- Valid MSME registration and verification
- Completed carbon assessment
- Environmental compliance certificates
- Positive carbon reduction trend

### Financial Requirements
- Loan amount within bank's range (₹1 lakh to ₹10 crores)
- Minimum business operation period (1-3 years)
- Stable financial performance
- Required documentation

## Carbon Score Discount System

Banks offer interest rate discounts based on carbon scores:

| Carbon Score Range | Discount Percentage | Example Banks |
|-------------------|-------------------|---------------|
| 90-100 | 2.0-2.5% | ICICI, Kotak |
| 80-89 | 1.5-2.0% | SBI, HDFC, ICICI |
| 70-79 | 1.0-1.5% | HDFC, ICICI, Kotak |
| 60-69 | 0.5-1.0% | SBI, Axis |

## Loan Application Process

1. **Eligibility Check**: MSME checks eligibility with selected bank
2. **Application Submission**: Complete loan application with project details
3. **Bank Review**: Bank reviews application and carbon assessment
4. **Approval/Rejection**: Bank approves or rejects with comments
5. **Disbursement**: Approved loans are disbursed
6. **Monitoring**: Ongoing carbon performance monitoring

## Sample Banks Included

The system includes 5 sample banks with different policies:

1. **State Bank of India (SBI)**
   - Min Carbon Score: 60
   - Loan Range: ₹1L - ₹5Cr
   - Interest Rate: 8.5% - 12.0%

2. **HDFC Bank**
   - Min Carbon Score: 65
   - Loan Range: ₹2L - ₹10Cr
   - Interest Rate: 9.0% - 13.5%

3. **ICICI Bank**
   - Min Carbon Score: 70
   - Loan Range: ₹1.5L - ₹7.5Cr
   - Interest Rate: 8.0% - 12.5%

4. **Axis Bank**
   - Min Carbon Score: 62
   - Loan Range: ₹1L - ₹2.5Cr
   - Interest Rate: 8.75% - 11.5%

5. **Kotak Mahindra Bank**
   - Min Carbon Score: 68
   - Loan Range: ₹2.5L - ₹3Cr
   - Interest Rate: 9.25% - 13.0%

## Setup Instructions

### Backend Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations
4. Seed sample banks: `npm run seed-banks`
5. Start server: `npm run dev`

### Frontend Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Start development server: `npm start`

## Usage

### For MSMEs
1. Complete carbon footprint assessment
2. Navigate to Green Loans section
3. Browse available banks and their policies
4. Use loan calculator to check eligibility
5. Apply for loan with project details
6. Track application status

### For Banks
1. Access bank dashboard (admin interface)
2. Review loan applications
3. Check carbon assessments and scores
4. Approve/reject applications with comments
5. Monitor disbursed loans

## Technical Architecture

### Database Schema
- **Banks**: Store bank information and policies
- **GreenLoans**: Track loan applications and terms
- **MSMEs**: Link to existing MSME data
- **CarbonAssessments**: Reference for eligibility

### API Design
- RESTful API design
- JWT authentication
- Input validation with express-validator
- Comprehensive error handling
- Logging with Winston

### Frontend Architecture
- React with TypeScript
- Material-UI components
- React Hook Form for validation
- Centralized API service
- Responsive design

## Future Enhancements

1. **Automated Credit Scoring**: AI-based loan approval
2. **Blockchain Integration**: Transparent carbon credit tracking
3. **Mobile App**: Native mobile application
4. **Real-time Monitoring**: Live carbon performance tracking
5. **Insurance Integration**: Green project insurance
6. **Government Schemes**: Integration with government green loan schemes

## Security Considerations

1. **Data Encryption**: All sensitive data encrypted
2. **Authentication**: JWT-based authentication
3. **Authorization**: Role-based access control
4. **Input Validation**: Comprehensive input sanitization
5. **Audit Logging**: Complete audit trail

## Monitoring and Analytics

1. **Loan Performance**: Track repayment rates
2. **Carbon Impact**: Measure actual vs. projected carbon reduction
3. **Bank Analytics**: Performance metrics for banks
4. **MSME Analytics**: Loan success rates and trends

## Conclusion

The bank integration provides a comprehensive solution for MSMEs to access green financing based on their carbon performance. The system incentivizes sustainable practices through better loan terms and creates a transparent, data-driven approach to green lending.

The modular design allows for easy expansion and integration with additional banks and financial institutions, making it a scalable solution for the growing green finance market.