import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from 'axios';

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
}

export interface HttpRequestOptions {
  method: Method;
  path: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class HttpClientError extends Error {
  readonly status?: number;
  readonly responseBody?: unknown;

  constructor(message: string, options?: { status?: number; responseBody?: unknown; cause?: unknown }) {
    super(message);
    this.name = 'HttpClientError';
    this.status = options?.status;
    this.responseBody = options?.responseBody;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export class HttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, timeoutMs = 30_000) {
    this.client = axios.create({
      baseURL,
      timeout: timeoutMs,
      validateStatus: () => true,
    });
  }

  async request<T = unknown>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const config: AxiosRequestConfig = {
      method: options.method,
      url: options.path,
      data: options.data,
      headers: options.headers,
      timeout: options.timeoutMs,
    };

    try {
      const response = await this.client.request<T>(config);
      return { status: response.status, data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw toHttpClientError(error);
      }
      throw new HttpClientError('Unexpected HTTP client failure', { cause: error });
    }
  }
}

function toHttpClientError(error: AxiosError): HttpClientError {
  return new HttpClientError(error.message, {
    status: error.response?.status,
    responseBody: error.response?.data,
    cause: error,
  });
}

export function assertSuccessStatus(status: number, context: string, responseBody?: unknown): void {
  if (status < 200 || status >= 300) {
    throw new HttpClientError(`${context} failed with HTTP ${status}`, {
      status,
      responseBody,
    });
  }
}
