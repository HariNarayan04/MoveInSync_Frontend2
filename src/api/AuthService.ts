import { httpClient } from './httpClient';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
  User
} from '@/types';

// Helper function to map backend roles to frontend roles
function mapBackendRole(backendRole: string): 'Admin' | 'Client' {
  const roleLower = backendRole.toLowerCase();
  if (roleLower === 'admin') return 'Admin';
  if (roleLower === 'user' || roleLower === 'client') return 'Client';
  return 'Client'; // default to Client
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // POST /api/v1/user/login
    // According to API_INTEGRATION.md, backend returns {success, message}
    // and sets httpOnly cookie with {_id, email, role}
    // IMPORTANT: Backend MUST also include user data in response body
    // because httpOnly cookies cannot be read by JavaScript
    const response = await httpClient.post<ApiResponse<{
      user: { _id: string; email: string; role: string; name?: string };
    }>>(
      '/api/v1/user/login',
      credentials
    );

    // Extract user data from response.data.data (ApiResponse wraps in data property)
    const userData = response.data.data;
    if (!userData?.user) {
      throw new Error('Backend error: User data not included in login response. Backend must return user object.');
    }

    const user: User = {
      id: userData.user._id,
      email: userData.user.email,
      role: mapBackendRole(userData.user.role),
      name: userData.user.name,
    };

    return {
      user,
      message: response.data.message,
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // POST /api/v1/user/signup
    // According to API_INTEGRATION.md, backend returns {success, message}
    // and sets httpOnly cookie with {_id, email, role}
    // IMPORTANT: Backend MUST also include user data in response body
    // because httpOnly cookies cannot be read by JavaScript
    const response = await httpClient.post<ApiResponse<{
      user: { _id: string; email: string; role: string; name?: string };
    }>>(
      '/api/v1/user/signup',
      credentials
    );

    // Extract user data from response.data.data (ApiResponse wraps in data property)
    const userData = response.data.data;
    if (!userData?.user) {
      throw new Error('Backend error: User data not included in signup response. Backend must return user object.');
    }

    const user: User = {
      id: userData.user._id,
      email: userData.user.email,
      role: mapBackendRole(userData.user.role),
      name: userData.user.name || credentials.name,
    };

    return {
      user,
      message: response.data.message,
    };
  }

  async logout(): Promise<void> {
    // CLIENT-SIDE ONLY - No API call needed
    // According to API_INTEGRATION.md section 3 (line 146):
    // "Implementation: NO API CALL"
    // Backend uses httpOnly cookies, which will be automatically cleared
    // when the session expires or can be cleared by setting max-age to 0

    // Note: We cannot manually clear httpOnly cookies from JavaScript
    // The backend should provide a logout endpoint if needed, or
    // cookies will expire based on their maxAge setting

    // Just clear client-side state (handled by authStore.logout())
  }
  
}

export const authService = new AuthService();
