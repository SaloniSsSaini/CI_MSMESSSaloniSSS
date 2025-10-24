import ApiService from '../api';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    localStorageMock.getItem.mockClear();
  });

  describe('request method', () => {
    test('makes GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await ApiService.request('/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('includes auth token when available', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await ApiService.request('/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );
    });

    test('handles request options correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await ApiService.request('/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: { 'Custom-Header': 'value' },
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' }),
          headers: expect.objectContaining({
            'Custom-Header': 'value',
          }),
        })
      );
    });

    test('throws error when response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });

      await expect(ApiService.request('/test')).rejects.toThrow('Not found');
    });

    test('throws error with status when no message provided', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(ApiService.request('/test')).rejects.toThrow('HTTP error! status: 500');
    });

    test('handles JSON parse error in error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(ApiService.request('/test')).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Auth endpoints', () => {
    test('login makes POST request with correct data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' }),
      });

      const result = await ApiService.login('test@example.com', 'password');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        })
      );
      expect(result).toEqual({ token: 'test-token' });
    });

    test('register makes POST request with correct data', async () => {
      const userData = { name: 'Test User', email: 'test@example.com' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.register(userData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('MSME endpoints', () => {
    test('getMSMEProfile makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profile: 'data' }),
      });

      const result = await ApiService.getMSMEProfile();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/msme/profile',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ profile: 'data' });
    });

    test('updateMSMEProfile makes PUT request with data', async () => {
      const updateData = { name: 'Updated Name' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.updateMSMEProfile(updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/msme/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('registerMSME makes POST request with data', async () => {
      const msmeData = { companyName: 'Test Company' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.registerMSME(msmeData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/msme/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(msmeData),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('getMSMEStats makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stats: 'data' }),
      });

      const result = await ApiService.getMSMEStats();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/msme/stats',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ stats: 'data' });
    });
  });

  describe('Carbon endpoints', () => {
    test('getCarbonAssessment makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ assessment: 'data' }),
      });

      const result = await ApiService.getCarbonAssessment();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/carbon/assessment',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ assessment: 'data' });
    });

    test('submitCarbonAssessment makes POST request with data', async () => {
      const assessmentData = { energy: 1000, water: 500 };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.submitCarbonAssessment(assessmentData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/carbon/assessment',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(assessmentData),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('getCarbonSavings makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ savings: 'data' }),
      });

      const result = await ApiService.getCarbonSavings();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/carbon/savings',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ savings: 'data' });
    });
  });

  describe('Bank endpoints', () => {
    test('getBanks makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ banks: [] }),
      });

      const result = await ApiService.getBanks();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/banks',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ banks: [] });
    });

    test('getBank makes GET request with ID', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ bank: 'data' }),
      });

      const result = await ApiService.getBank('bank-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/banks/bank-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ bank: 'data' });
    });

    test('getBankLoans makes GET request with query params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ loans: [] }),
      });

      const result = await ApiService.getBankLoans('bank-123', {
        status: 'active',
        page: 1,
        limit: 10,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/banks/bank-123/loans?status=active&page=1&limit=10',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ loans: [] });
    });

    test('getBankLoans makes GET request without query params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ loans: [] }),
      });

      const result = await ApiService.getBankLoans('bank-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/banks/bank-123/loans',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ loans: [] });
    });

    test('getBankStatistics makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ statistics: 'data' }),
      });

      const result = await ApiService.getBankStatistics('bank-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/banks/bank-123/statistics',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ statistics: 'data' });
    });
  });

  describe('Green Loan endpoints', () => {
    test('checkLoanEligibility makes POST request with data', async () => {
      const eligibilityData = { amount: 100000, companyType: 'micro' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ eligible: true }),
      });

      const result = await ApiService.checkLoanEligibility(eligibilityData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/green-loans/eligibility-check',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(eligibilityData),
        })
      );
      expect(result).toEqual({ eligible: true });
    });

    test('applyForLoan makes POST request with data', async () => {
      const loanData = { amount: 100000, purpose: 'solar' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ applicationId: 'app-123' }),
      });

      const result = await ApiService.applyForLoan(loanData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/green-loans/apply',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(loanData),
        })
      );
      expect(result).toEqual({ applicationId: 'app-123' });
    });

    test('getMyLoans makes GET request with query params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ loans: [] }),
      });

      const result = await ApiService.getMyLoans({
        status: 'approved',
        page: 1,
        limit: 10,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/green-loans/my-loans?status=approved&page=1&limit=10',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ loans: [] });
    });

    test('getLoanDetails makes GET request with ID', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ loan: 'data' }),
      });

      const result = await ApiService.getLoanDetails('loan-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/green-loans/loan-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ loan: 'data' });
    });

    test('updateLoanStatus makes PUT request with data', async () => {
      const statusData = { status: 'approved' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.updateLoanStatus('loan-123', statusData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/green-loans/loan-123/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(statusData),
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Transaction endpoints', () => {
    test('getTransactions makes GET request with query params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ transactions: [] }),
      });

      const result = await ApiService.getTransactions({
        page: 1,
        limit: 10,
        category: 'energy',
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/transactions?page=1&limit=10&category=energy',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ transactions: [] });
    });

    test('createTransaction makes POST request with data', async () => {
      const transactionData = { amount: 1000, category: 'energy' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ transactionId: 'tx-123' }),
      });

      const result = await ApiService.createTransaction(transactionData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/transactions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(transactionData),
        })
      );
      expect(result).toEqual({ transactionId: 'tx-123' });
    });

    test('updateTransaction makes PUT request with data', async () => {
      const updateData = { amount: 1500 };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.updateTransaction('tx-123', updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/transactions/tx-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('deleteTransaction makes DELETE request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.deleteTransaction('tx-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/transactions/tx-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Incentives endpoints', () => {
    test('getIncentives makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ incentives: [] }),
      });

      const result = await ApiService.getIncentives();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/incentives',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ incentives: [] });
    });

    test('claimIncentive makes POST request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.claimIncentive('incentive-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/incentives/incentive-123/claim',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('GIFT Scheme endpoints', () => {
    test('getGIFTSchemes makes GET request with query params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schemes: [] }),
      });

      const result = await ApiService.getGIFTSchemes({
        category: 'energy',
        status: 'active',
        page: 1,
        limit: 10,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-schemes?category=energy&status=active&page=1&limit=10',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ schemes: [] });
    });

    test('getGIFTScheme makes GET request with ID', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ scheme: 'data' }),
      });

      const result = await ApiService.getGIFTScheme('scheme-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-schemes/scheme-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ scheme: 'data' });
    });

    test('checkGIFTSchemeEligibility makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ eligible: true }),
      });

      const result = await ApiService.checkGIFTSchemeEligibility('scheme-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-schemes/scheme-123/eligibility',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ eligible: true });
    });
  });

  describe('GIFT Application endpoints', () => {
    test('getGIFTApplications makes GET request with query params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ applications: [] }),
      });

      const result = await ApiService.getGIFTApplications({
        status: 'pending',
        page: 1,
        limit: 10,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-applications?status=pending&page=1&limit=10',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ applications: [] });
    });

    test('getGIFTApplication makes GET request with ID', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ application: 'data' }),
      });

      const result = await ApiService.getGIFTApplication('app-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-applications/app-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ application: 'data' });
    });

    test('createGIFTApplication makes POST request with data', async () => {
      const applicationData = { schemeId: 'scheme-123', amount: 50000 };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ applicationId: 'app-123' }),
      });

      const result = await ApiService.createGIFTApplication(applicationData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-applications',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(applicationData),
        })
      );
      expect(result).toEqual({ applicationId: 'app-123' });
    });

    test('updateGIFTApplication makes PUT request with data', async () => {
      const updateData = { status: 'submitted' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.updateGIFTApplication('app-123', updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-applications/app-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('submitGIFTApplication makes POST request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.submitGIFTApplication('app-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/gift-applications/app-123/submit',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Reporting endpoints', () => {
    test('getReports makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reports: [] }),
      });

      const result = await ApiService.getReports();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/reporting',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ reports: [] });
    });

    test('generateReport makes POST request with type and params', async () => {
      const params = { startDate: '2023-01-01', endDate: '2023-12-31' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reportId: 'report-123' }),
      });

      const result = await ApiService.generateReport('carbon', params);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/reporting/carbon',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      );
      expect(result).toEqual({ reportId: 'report-123' });
    });
  });

  describe('Data Privacy endpoints', () => {
    test('getPrivacySettings makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ settings: 'data' }),
      });

      const result = await ApiService.getPrivacySettings();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/settings',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ settings: 'data' });
    });

    test('updatePrivacySettings makes PUT request with data', async () => {
      const settingsData = { dataSharing: false };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.updatePrivacySettings(settingsData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/settings',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(settingsData),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('getDataRequests makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ requests: [] }),
      });

      const result = await ApiService.getDataRequests();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/requests',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ requests: [] });
    });

    test('submitDataRequest makes POST request with data', async () => {
      const requestData = { type: 'deletion', reason: 'privacy' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-123' }),
      });

      const result = await ApiService.submitDataRequest(requestData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/requests',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual({ requestId: 'req-123' });
    });

    test('getDataActivities makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: [] }),
      });

      const result = await ApiService.getDataActivities();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/activities',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ activities: [] });
    });

    test('downloadPersonalData makes GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ downloadUrl: 'url' }),
      });

      const result = await ApiService.downloadPersonalData();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/download',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ downloadUrl: 'url' });
    });

    test('updateConsentPreferences makes POST request with data', async () => {
      const consentData = { marketing: false, analytics: true };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await ApiService.updateConsentPreferences(consentData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-privacy/consent',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(consentData),
        })
      );
      expect(result).toEqual({ success: true });
    });
  });
});
