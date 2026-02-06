export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthContextType {
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  refreshToken: () => Promise<string>;
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}