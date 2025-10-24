# Carbon Credits System Documentation

## Overview

The Carbon Credits System enables MSMEs to aggregate their individual carbon savings and claim carbon credits from the Indian Carbon Market. Since individual MSME carbon savings are often negligible, the system pools all MSMEs' carbon reductions and allocates credits proportionally based on their contributions.

## Key Features

### 1. Carbon Credits Pool
- **Pool ID**: `indian_carbon_market_pool`
- **Aggregation**: Monthly, quarterly, and yearly aggregation of carbon savings
- **Credit Allocation**: Proportional allocation based on CO2 reduction contributions
- **Market Compliance**: Integration with Indian Carbon Market regulations

### 2. MSME Carbon Credits Management
- Individual credit accounts for each MSME
- Credit allocation based on carbon savings
- Credit usage, transfer, and retirement capabilities
- Performance tracking and metrics

### 3. Market Integration
- Price tracking and history
- Transaction management
- Regulatory compliance verification
- Market data and analytics

## Database Schema

### CarbonCredits (Pool)
```javascript
{
  poolId: String, // 'indian_carbon_market_pool'
  totalCreditsAvailable: Number,
  totalCreditsIssued: Number,
  totalCreditsUsed: Number,
  totalCreditsRetired: Number,
  currentPricePerCredit: Number,
  priceHistory: [{
    date: Date,
    price: Number,
    volume: Number
  }],
  totalCO2Reduced: Number,
  totalMSMEParticipants: Number,
  verificationStatus: String, // 'pending', 'verified', 'rejected', 'under_review'
  indianCarbonMarketCompliance: {
    isCompliant: Boolean,
    complianceCertificate: String,
    complianceDate: Date,
    regulatoryBody: String
  }
}
```

### MSMECarbonCredits (Individual MSME)
```javascript
{
  msmeId: ObjectId,
  poolId: String,
  allocatedCredits: Number,
  availableCredits: Number,
  usedCredits: Number,
  retiredCredits: Number,
  totalCO2Reduced: Number,
  allocationHistory: [{
    date: Date,
    creditsAllocated: Number,
    co2Reduced: Number,
    allocationMethod: String, // 'proportional', 'performance_based', 'equal_share', 'hybrid'
    assessmentId: ObjectId
  }],
  transactions: [{
    type: String, // 'allocation', 'usage', 'transfer', 'retirement', 'expiry'
    amount: Number,
    description: String,
    referenceId: String,
    status: String,
    timestamp: Date
  }],
  performanceMetrics: {
    carbonEfficiency: Number,
    participationScore: Number,
    lastUpdated: Date
  }
}
```

### CarbonCreditTransaction (Market Transactions)
```javascript
{
  transactionId: String,
  poolId: String,
  fromMSME: ObjectId,
  toMSME: ObjectId,
  type: String, // 'purchase', 'sale', 'transfer', 'retirement', 'allocation'
  creditsAmount: Number,
  pricePerCredit: Number,
  totalValue: Number,
  marketType: String, // 'primary', 'secondary', 'auction', 'bilateral'
  status: String,
  regulatoryCompliance: {
    isCompliant: Boolean,
    complianceCertificate: String,
    regulatoryBody: String
  }
}
```

## API Endpoints

### Carbon Credits Management

#### 1. Aggregate and Allocate Credits
```http
POST /api/carbon-credits/aggregate
Content-Type: application/json
Authorization: Bearer <token>

{
  "period": "monthly" // "monthly", "quarterly", "yearly"
}
```

#### 2. Get MSME Carbon Credits
```http
GET /api/carbon-credits/my-credits
Authorization: Bearer <token>
```

#### 3. Use Carbon Credits
```http
POST /api/carbon-credits/use
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 50,
  "purpose": "Carbon offset purchase",
  "referenceId": "OFFSET_001"
}
```

#### 4. Retire Carbon Credits
```http
POST /api/carbon-credits/retire
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 25,
  "reason": "Voluntary retirement for environmental impact"
}
```

#### 5. Transfer Credits
```http
POST /api/carbon-credits/transfer
Content-Type: application/json
Authorization: Bearer <token>

{
  "toMSMEId": "64a1b2c3d4e5f6789012345",
  "amount": 30,
  "description": "Credit transfer to partner MSME"
}
```

### Market Data

#### 6. Get Market Data
```http
GET /api/carbon-credits/market
Authorization: Bearer <token>
```

#### 7. Get Leaderboard
```http
GET /api/carbon-credits/leaderboard?limit=10&period=monthly
Authorization: Bearer <token>
```

#### 8. Get Transactions
```http
GET /api/carbon-credits/transactions?page=1&limit=10&type=allocation
Authorization: Bearer <token>
```

### MSME Integration

#### 9. Get MSME Carbon Credits Details
```http
GET /api/msme/carbon-credits
Authorization: Bearer <token>
```

#### 10. Get MSME Stats (includes carbon credits)
```http
GET /api/msme/stats
Authorization: Bearer <token>
```

## Credit Allocation Methods

### 1. Proportional Allocation
- Credits allocated based on CO2 reduction contribution
- Formula: `(MSME CO2 Reduced / Total CO2 Reduced) × Total Credits Available`

### 2. Performance-Based Allocation
- Credits allocated based on carbon efficiency and participation score
- Considers both absolute reduction and relative performance

### 3. Equal Share Allocation
- Equal credits for all participating MSMEs
- Used when individual contributions are similar

### 4. Hybrid Allocation
- Combination of proportional and performance-based methods
- Balances fairness with performance incentives

## Credit Calculation

### CO2 to Credits Conversion
- **Rate**: 1 credit per 10kg CO2 reduced (0.1 credits per kg)
- **Minimum Threshold**: 100 credits for allocation eligibility
- **Verification**: Based on verified carbon assessments

### Example Calculation
```
MSME A reduces 500kg CO2
Credits = 500 × 0.1 = 50 credits

MSME B reduces 200kg CO2  
Credits = 200 × 0.1 = 20 credits

Total Pool: 1000kg CO2 = 100 credits
MSME A gets: (500/1000) × 100 = 50 credits
MSME B gets: (200/1000) × 100 = 20 credits
```

## Performance Metrics

### Carbon Efficiency
- Credits per kg CO2 reduced
- Higher efficiency = better performance

### Participation Score (0-100)
- Based on recent allocation history
- Considers frequency and consistency of contributions
- Formula: `(Recent Allocations × 10) + (Total CO2 Reduced / 100)`

## Market Compliance

### Indian Carbon Market Integration
- Compliance with Ministry of Environment, Forest and Climate Change regulations
- Verification and certification requirements
- Regulatory reporting and documentation

### Verification Process
1. Pool verification by authorized personnel
2. Compliance certificate generation
3. Regulatory body approval
4. Market listing and trading eligibility

## Usage Examples

### 1. Initialize Carbon Credits System
```bash
npm run init-carbon-credits
```

### 2. Run Monthly Aggregation
```javascript
const result = await carbonCreditsService.aggregateAndAllocateCredits('monthly');
console.log(`Allocated ${result.data.totalCreditsAllocated} credits to ${result.data.msmeCount} MSMEs`);
```

### 3. Get MSME Credits
```javascript
const msmeCredits = await carbonCreditsService.getMSMECredits(msmeId);
console.log(`Available credits: ${msmeCredits.availableCredits}`);
```

### 4. Use Credits
```javascript
await carbonCreditsService.useCredits(
  msmeId,
  50,
  'Carbon offset purchase',
  'OFFSET_001'
);
```

## Testing

### Run Carbon Credits Tests
```bash
npm run test:carbon-credits
```

### Test Coverage
- Pool initialization
- MSME credits management
- Credit allocation and usage
- Market data retrieval
- Transaction management
- Performance metrics calculation

## Monitoring and Analytics

### Key Metrics
- Total credits in circulation
- MSME participation rate
- Average credit allocation per MSME
- Market price trends
- CO2 reduction achievements

### Dashboard Data
- Real-time credit balances
- Allocation history
- Transaction logs
- Performance rankings
- Market statistics

## Security and Compliance

### Data Protection
- Encrypted credit transactions
- Audit trails for all operations
- Role-based access control
- Regulatory compliance tracking

### Verification Requirements
- Multi-level verification process
- Compliance certificate management
- Regulatory reporting automation
- Market integration validation

## Future Enhancements

### Planned Features
1. **Automated Market Integration**: Direct integration with Indian Carbon Market exchanges
2. **Smart Contracts**: Blockchain-based credit verification and trading
3. **AI-Powered Allocation**: Machine learning for optimal credit distribution
4. **Real-time Pricing**: Dynamic pricing based on market conditions
5. **Mobile App Integration**: Mobile access to carbon credits management

### Scalability Considerations
- Horizontal scaling for high-volume transactions
- Caching for frequently accessed data
- Microservices architecture for modular deployment
- API rate limiting and load balancing

## Support and Maintenance

### Regular Tasks
- Monthly credit aggregation
- Performance metrics updates
- Market data synchronization
- Compliance verification
- System health monitoring

### Troubleshooting
- Check database connectivity
- Verify MSME data integrity
- Validate carbon assessment data
- Monitor API response times
- Review error logs and metrics

## Contact Information

For technical support or questions about the Carbon Credits System:
- **Email**: support@carbonintelligence.com
- **Documentation**: [API Documentation](./API_DOCUMENTATION.md)
- **Issues**: GitHub Issues Repository