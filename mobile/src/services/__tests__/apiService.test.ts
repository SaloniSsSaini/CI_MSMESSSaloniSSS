// Mock axios before importing the service
const mockAxios = jest.fn((config) => {
  return Promise.resolve({
    data: { success: true, message: 'Mock response' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
});

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
}));

import { apiService } from '../apiService';

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call login endpoint with correct parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: { id: 1, email: 'test@example.com' },
          },
        },
      };

      mockAxios.mockResolvedValue(mockResponse);

      const result = await apiService.login('test@example.com', 'password123');

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:5000/api/auth/login',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          email: 'test@example.com',
          password: 'password123',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login errors', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      };

      mockAxios.mockRejectedValue(mockError);

      try {
        await apiService.login('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  describe('register', () => {
    it('should call register endpoint with correct parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: { id: 1, email: 'test@example.com' },
          },
        },
      };

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Company',
        industry: 'Manufacturing',
      };

      mockAxios.mockResolvedValue(mockResponse);

      const result = await apiService.register(userData);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:5000/api/auth/register',
        headers: {
          'Content-Type': 'application/json',
        },
        data: userData,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getDashboard', () => {
    it('should call dashboard endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            currentScore: 75,
            currentMonthEmissions: 1000,
            totalTransactions: 25,
          },
        },
      };

      mockAxios.mockResolvedValue(mockResponse);

      const result = await apiService.getDashboard();

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:5000/api/carbon/dashboard',
        headers: {
          'Content-Type': 'application/json',
        },
        data: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTransactions', () => {
    it('should call transactions endpoint with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            transactions: [],
            total: 0,
            page: 1,
            limit: 10,
          },
        },
      };

      mockAxios.mockResolvedValue(mockResponse);

      const result = await apiService.getTransactions({ page: 1, limit: 10 });

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:5000/api/transactions?page=1&limit=10',
        headers: {
          'Content-Type': 'application/json',
        },
        data: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('performCarbonAssessment', () => {
    it('should call carbon assessment endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            totalEmissions: 1000,
            categoryBreakdown: {},
          },
        },
      };

      mockAxios.mockResolvedValue(mockResponse);

      const result = await apiService.performCarbonAssessment();

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:5000/api/carbon/assess',
        headers: {
          'Content-Type': 'application/json',
        },
        data: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAnalyticsOverview', () => {
    it('should call analytics endpoint with date range', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            charts: [],
            insights: [],
          },
        },
      };

      const params = { startDate: '2024-01-01', endDate: '2024-01-31' };

      mockAxios.mockResolvedValue(mockResponse);

      const result = await apiService.getAnalyticsOverview(params);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:5000/api/analytics/overview?startDate=2024-01-01&endDate=2024-01-31',
        headers: {
          'Content-Type': 'application/json',
        },
        data: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});