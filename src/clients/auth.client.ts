import { scheduleConfig } from '../config/schedule';
import { assertSuccessStatus, HttpClient, HttpClientError } from './http-client';

export interface LoginCredentials {
  email: string;
  password: string;
  countryCode: string;
  consumerUsername: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
}

interface LoginResponseBody {
  accessToken?: unknown;
  refreshToken?: unknown;
  tokenType?: unknown;
}

/**
 * Calls the existing auth-service login route used by incycle-web (`auth/login`).
 */
export class AuthClient {
  constructor(private readonly http: HttpClient) {}

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await this.http.request<LoginResponseBody>({
      method: 'POST',
      path: scheduleConfig.routes.login,
      data: {
        email: credentials.email,
        password: credentials.password,
        countryCode: credentials.countryCode,
        consumerUsername: credentials.consumerUsername,
      },
    });

    assertSuccessStatus(response.status, 'Login', response.data);

    const accessToken =
      typeof response.data?.accessToken === 'string' ? response.data.accessToken.trim() : '';

    if (!accessToken) {
      throw new HttpClientError('Login response did not include a valid accessToken', {
        status: response.status,
        responseBody: sanitizeLoginBody(response.data),
      });
    }

    return {
      accessToken,
      refreshToken:
        typeof response.data.refreshToken === 'string' ? response.data.refreshToken : undefined,
      tokenType: typeof response.data.tokenType === 'string' ? response.data.tokenType : undefined,
    };
  }
}

function sanitizeLoginBody(body: LoginResponseBody | undefined): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    return {};
  }

  return {
    hasAccessToken: typeof body.accessToken === 'string' && body.accessToken.length > 0,
    hasRefreshToken: typeof body.refreshToken === 'string' && body.refreshToken.length > 0,
    tokenType: body.tokenType,
  };
}
