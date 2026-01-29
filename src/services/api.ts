const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    console.log(userData)
    console.log("api.ts 43")
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

async forgotPassword(userData: any) {
  console.log(userData)
  return this.request('/auth/forgot-password', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"   // <-- required!
    },
    body: JSON.stringify(userData)
  });
}

async resetPassword(userData: { token: string; password: string }) {
  console.log("Reset password payload:", userData);

  return this.request('/auth/reset-password', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
}



  // MSME endpoints
  async getMSMEProfile() {
    return this.request('/msme/profile');
  }

  async updateMSMEProfile(data: any) {
    return this.request('/msme/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async registerMSME(data: any) {
    console.log("63 api.ts", data)
    return this.request('/msme/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMSMEStats() {
    return this.request('/msme/stats');
  }

  // Carbon endpoints
  async getCarbonAssessment() {
    return this.request('/carbon/assessment');
  }

  async submitCarbonAssessment(data: any) {
    return this.request('/carbon/assessment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCarbonSavings() {
    return this.request('/carbon/savings');
  }

  // Bank endpoints
  async getBanks() {
    return this.request('/banks');
  }

  async getBank(id: string) {
    return this.request(`/banks/${id}`);
  }

  async getBankLoans(bankId: string, params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/banks/${bankId}/loans${queryString ? `?${queryString}` : ''}`);
  }

  async getBankStatistics(bankId: string) {
    return this.request(`/banks/${bankId}/statistics`);
  }

  // Green Loan endpoints
  async checkLoanEligibility(data: any) {
    return this.request('/green-loans/eligibility-check', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyForLoan(data: any) {
    return this.request('/green-loans/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyLoans(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/green-loans/my-loans${queryString ? `?${queryString}` : ''}`);
  }

  async getLoanDetails(loanId: string) {
    return this.request(`/green-loans/${loanId}`);
  }

  async updateLoanStatus(loanId: string, data: any) {
    return this.request(`/green-loans/${loanId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Transaction endpoints
  async getTransactions(params?: { page?: number; limit?: number; category?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString();
    return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async createTransaction(data: any) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Incentives endpoints
  async getIncentives() {
    return this.request('/incentives');
  }

  async claimIncentive(incentiveId: string) {
    return this.request(`/incentives/${incentiveId}/claim`, {
      method: 'POST',
    });
  }

  // Reporting endpoints
  async getCbamReport(params?: { period?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    return this.request(`/reporting/cbam${queryString ? `?${queryString}` : ''}`);
  }

  // GIFT Scheme endpoints
  async getGIFTSchemes(params?: { category?: string; status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/gift-schemes${queryString ? `?${queryString}` : ""}`);
  }

  async getGIFTScheme(id: string) {
    return this.request(`/gift-schemes/${id}`);
  }

  async checkGIFTSchemeEligibility(schemeId: string) {
    return this.request(`/gift-schemes/${schemeId}/eligibility`);
  }

  // GIFT Application endpoints
  async getGIFTApplications(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/gift-applications${queryString ? `?${queryString}` : ""}`);
  }

  async getGIFTApplication(id: string) {
    return this.request(`/gift-applications/${id}`);
  }

  async createGIFTApplication(data: any) {
    return this.request("/gift-applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateGIFTApplication(id: string, data: any) {
    return this.request(`/gift-applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async submitGIFTApplication(id: string) {
    return this.request(`/gift-applications/${id}/submit`, {
      method: "POST",
    });
  }
  async getReports() {
    return this.request('/reporting');
  }

  async generateReport(type: string, params?: any) {
    return this.request(`/reporting/${type}`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Data Privacy endpoints
  async getPrivacySettings() {
    return this.request('/data-privacy/settings');
  }

  async updatePrivacySettings(data: any) {
    return this.request('/data-privacy/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async ingestEmailAssessment(data: any) {
    return this.request('/email/ingest-assess', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDataRequests() {
    return this.request('/data-privacy/requests');
  }

  async submitDataRequest(data: any) {
    return this.request('/data-privacy/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDataActivities() {
    return this.request('/data-privacy/activities');
  }

  async downloadPersonalData() {
    return this.request('/data-privacy/download');
  }

  async updateConsentPreferences(data: any) {
    return this.request('/data-privacy/consent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export default new ApiService();