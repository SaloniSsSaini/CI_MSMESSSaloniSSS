// Import the mocked axios from setupTests
import axios from 'axios';

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

      (axios as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.login('test@example.com', 'password123');

      expect(axios).toHaveBeenCalledWith({
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

      (axios as jest.Mock).mockRejectedValue(mockError);

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

      (axios as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.register(userData);

      expect(axios).toHaveBeenCalledWith({
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

      (axios as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.getDashboard();

      expect(axios).toHaveBeenCalledWith({
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

      (axios as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.getTransactions({ page: 1, limit: 10 });

      expect(axios).toHaveBeenCalledWith({
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

      (axios as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.performCarbonAssessment();

      expect(axios).toHaveBeenCalledWith({
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

      (axios as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiService.getAnalyticsOverview(params);

      expect(axios).toHaveBeenCalledWith({
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