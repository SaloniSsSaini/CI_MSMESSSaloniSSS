import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Change this to your backend URL

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting token:', error);
    }
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders(),
        data,
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.makeRequest('POST', '/auth/login', { email, password });
  }

  async register(userData: any) {
    return this.makeRequest('POST', '/auth/register', userData);
  }

  async getCurrentUser() {
    return this.makeRequest('GET', '/auth/me');
  }

  // Dashboard endpoints
  async getDashboard() {
    return this.makeRequest('GET', '/carbon/dashboard');
  }

  // Transaction endpoints
  async getTransactions(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/transactions${queryString}`);
  }

  async getTransaction(id: string) {
    return this.makeRequest('GET', `/transactions/${id}`);
  }

  async updateTransaction(id: string, data: any) {
    return this.makeRequest('PUT', `/transactions/${id}`, data);
  }

  async deleteTransaction(id: string) {
    return this.makeRequest('DELETE', `/transactions/${id}`);
  }

  // SMS endpoints
  async processSMS(smsData: any) {
    return this.makeRequest('POST', '/sms/process', smsData);
  }

  async getSMSTransactions(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/sms/transactions${queryString}`);
  }

  async getSMSAnalytics(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/sms/analytics${queryString}`);
  }

  async bulkProcessSMS(messages: any[]) {
    return this.makeRequest('POST', '/sms/bulk-process', { messages });
  }

  // Email endpoints
  async processEmail(emailData: any) {
    return this.makeRequest('POST', '/email/process', emailData);
  }

  async getEmailTransactions(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/email/transactions${queryString}`);
  }

  async getEmailAnalytics(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/email/analytics${queryString}`);
  }

  async bulkProcessEmail(emails: any[]) {
    return this.makeRequest('POST', '/email/bulk-process', { emails });
  }

  async connectEmail(emailData: any) {
    return this.makeRequest('POST', '/email/connect', emailData);
  }

  // Carbon footprint endpoints
  async performCarbonAssessment(data?: any) {
    return this.makeRequest('POST', '/carbon/assess', data);
  }

  async getCarbonAssessments(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/carbon/assessments${queryString}`);
  }

  async getCarbonAssessment(id: string) {
    return this.makeRequest('GET', `/carbon/assessments/${id}`);
  }

  async implementRecommendation(assessmentId: string, recommendationIndex: number) {
    return this.makeRequest('PUT', '/carbon/recommendations/implement', {
      assessmentId,
      recommendationIndex,
    });
  }

  // Analytics endpoints
  async getAnalyticsOverview(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/analytics/overview${queryString}`);
  }

  async getAnalyticsTrends(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/analytics/trends${queryString}`);
  }

  async getAnalyticsInsights(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/analytics/insights${queryString}`);
  }

  // MSME endpoints
  async getMSMEProfile() {
    return this.makeRequest('GET', '/msme/profile');
  }

  async updateMSMEProfile(data: any) {
    return this.makeRequest('PUT', '/msme/profile', data);
  }

  async registerMSME(data: any) {
    return this.makeRequest('POST', '/msme/register', data);
  }

  async getMSMEStats() {
    return this.makeRequest('GET', '/msme/stats');
  }

  // Carbon trading endpoints
  async getCarbonTradingPortfolio() {
    return this.makeRequest('GET', '/carbon/trading/portfolio');
  }

  async getCarbonOffsetOptions(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/carbon/trading/offsets${queryString}`);
  }

  async purchaseCarbonOffset(data: any) {
    return this.makeRequest('POST', '/carbon/trading/purchase', data);
  }

  async getCarbonTradingHistory(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/carbon/trading/history${queryString}`);
  }

  async getCarbonMarketTrends(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest('GET', `/carbon/trading/market-trends${queryString}`);
  }

  // Utility methods
  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('userToken', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('userToken');
  }
}

export const apiService = new ApiService();