import { AuthClient } from './clients/auth.client';
import { HttpClient } from './clients/http-client';
import { ShopsClient } from './clients/shops.client';
import { env } from './config/env';
import { setLogLevel } from './logging/logger';
import { DropshipScheduler } from './scheduler/dropship-scheduler';
import { ToggleDropshipService } from './services/toggle-dropship.service';

export function createToggleDropshipService(): ToggleDropshipService {
  setLogLevel(env.LOG_LEVEL);

  const http = new HttpClient(env.API_BASE_URL);
  const authClient = new AuthClient(http);
  const shopsClient = new ShopsClient(http);

  return new ToggleDropshipService({
    authClient,
    shopsClient,
    credentials: {
      email: env.AUTH_EMAIL,
      password: env.AUTH_PASSWORD,
      countryCode: env.AUTH_COUNTRY_CODE,
      consumerUsername: env.AUTH_CONSUMER_USERNAME,
    },
    merchantCode: env.MERCHANT_CODE,
  });
}

export function createDropshipScheduler(service = createToggleDropshipService()): DropshipScheduler {
  return new DropshipScheduler({ service });
}
