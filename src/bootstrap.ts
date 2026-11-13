import { AuthClient } from './clients/auth.client';
import { HttpClient } from './clients/http-client';
import { ShopsClient } from './clients/shops.client';
import { env } from './config/env';
import { setLogLevel } from './logging/logger';
import { DropshipScheduler } from './scheduler/dropship-scheduler';
import { ToggleDropshipService } from './services/toggle-dropship.service';

export function createAuthClient(): AuthClient {
  setLogLevel(env.LOG_LEVEL);
  return new AuthClient(new HttpClient(env.API_BASE_URL));
}

export function createShopsClient(): ShopsClient {
  setLogLevel(env.LOG_LEVEL);
  return new ShopsClient(new HttpClient(env.API_BASE_URL));
}

export function getLoginCredentials() {
  return {
    email: env.AUTH_EMAIL,
    password: env.AUTH_PASSWORD,
    countryCode: env.AUTH_COUNTRY_CODE,
    consumerUsername: env.AUTH_CONSUMER_USERNAME,
  };
}

export function getMerchantCode(): string {
  return env.MERCHANT_CODE;
}

export function createToggleDropshipService(): ToggleDropshipService {
  setLogLevel(env.LOG_LEVEL);

  const http = new HttpClient(env.API_BASE_URL);
  const authClient = new AuthClient(http);
  const shopsClient = new ShopsClient(http);

  return new ToggleDropshipService({
    authClient,
    shopsClient,
    credentials: getLoginCredentials(),
    merchantCode: getMerchantCode(),
  });
}

export function createDropshipScheduler(service = createToggleDropshipService()): DropshipScheduler {
  return new DropshipScheduler({ service });
}
