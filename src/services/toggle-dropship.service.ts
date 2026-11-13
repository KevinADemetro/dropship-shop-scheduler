import { AuthClient, LoginCredentials } from '../clients/auth.client';
import { ShopsClient } from '../clients/shops.client';
import { DropshipRoutineName, scheduleConfig } from '../config/schedule';
import { logger } from '../logging/logger';

export interface ToggleDropshipDependencies {
  authClient: AuthClient;
  shopsClient: ShopsClient;
  credentials: LoginCredentials;
  merchantCode: string;
}

export interface ToggleDropshipResult {
  routine: DropshipRoutineName;
  isActive: boolean;
  executedAt: string;
  loginSucceeded: boolean;
  updateSucceeded: boolean;
}

/**
 * Always logs in immediately before updating the shop. Never reuses a previous token.
 */
export class ToggleDropshipService {
  constructor(private readonly deps: ToggleDropshipDependencies) {}

  async run(routine: DropshipRoutineName): Promise<ToggleDropshipResult> {
    const executedAt = new Date().toISOString();
    const { isActive, description } = scheduleConfig.routines[routine];

    logger.info('Dropship routine started', {
      routine,
      description,
      executedAt,
      isActive,
      shopID: scheduleConfig.shop.shopID,
      tenantName: scheduleConfig.shop.tenantName,
      merchantCode: this.deps.merchantCode,
    });

    let accessToken: string;
    try {
      const login = await this.deps.authClient.login(this.deps.credentials);
      accessToken = login.accessToken;
      logger.info('Dropship login succeeded', {
        routine,
        executedAt,
        tokenType: login.tokenType ?? null,
      });
    } catch (error) {
      logger.error('Dropship login failed — update will not run', {
        routine,
        executedAt,
        ...serializeError(error),
      });
      throw error;
    }

    try {
      const updateResult = await this.deps.shopsClient.updateDropshipActive({
        accessToken,
        merchantCode: this.deps.merchantCode,
        isActive,
        countryCode: this.deps.credentials.countryCode,
      });

      logger.info('Dropship shop update succeeded', {
        routine,
        executedAt,
        isActive,
        response: updateResult,
      });

      return {
        routine,
        isActive,
        executedAt,
        loginSucceeded: true,
        updateSucceeded: true,
      };
    } catch (error) {
      logger.error('Dropship shop update failed', {
        routine,
        executedAt,
        isActive,
        ...serializeError(error),
      });
      throw error;
    }
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error && typeof error === 'object') {
    const err = error as { message?: unknown; status?: unknown; responseBody?: unknown; name?: unknown };
    return {
      errorName: typeof err.name === 'string' ? err.name : 'Error',
      errorMessage: typeof err.message === 'string' ? err.message : String(error),
      httpStatus: err.status ?? null,
      httpResponse: err.responseBody ?? null,
    };
  }

  return { errorMessage: String(error) };
}
