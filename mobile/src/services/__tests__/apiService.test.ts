import { apiService } from '../apiService';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call login endpoint with correct parameters', async () => {
      const mockAxios = require('axios').create();
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: { id: 1, email: 'test@example.com' },
          },
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await apiService.login('test@example.com', 'password123');

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login errors', async () => {
      const mockAxios = require('axios').create();
      const mockError = {
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      };

      mockAxios.post.mockRejectedValue(mockError);

      try {
        await apiService.login('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  describe('register', () => {
    it('should call register endpoint with correct parameters', async () => {
      const mockAxios = require('axios').create();
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

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await apiService.register(userData);

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getDashboard', () => {
    it('should call dashboard endpoint', async () => {
      const mockAxios = require('axios').create();
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

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.getDashboard();

      expect(mockAxios.get).toHaveBeenCalledWith('/dashboard');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTransactions', () => {
    it('should call transactions endpoint with pagination', async () => {
      const mockAxios = require('axios').create();
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

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.getTransactions(1, 10);

      expect(mockAxios.get).toHaveBeenCalledWith('/transactions?page=1&limit=10');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCarbonFootprint', () => {
    it('should call carbon footprint endpoint', async () => {
      const mockAxios = require('axios').create();
      const mockResponse = {
        data: {
          success: true,
          data: {
            totalEmissions: 1000,
            categoryBreakdown: {},
          },
        },
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.getCarbonFootprint();

      expect(mockAxios.get).toHaveBeenCalledWith('/carbon-footprint');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAnalytics', () => {
    it('should call analytics endpoint with date range', async () => {
      const mockAxios = require('axios').create();
      const mockResponse = {
        data: {
          success: true,
          data: {
            charts: [],
            insights: [],
          },
        },
      };

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.getAnalytics(startDate, endDate);

      expect(mockAxios.get).toHaveBeenCalledWith(`/analytics?startDate=${startDate}&endDate=${endDate}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});