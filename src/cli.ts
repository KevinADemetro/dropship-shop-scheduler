import { createAuthClient, createToggleDropshipService, getLoginCredentials } from './bootstrap';
import { DropshipRoutineName } from './config/schedule';
import { logger } from './logging/logger';

const USAGE = `Usage: yarn cli <login|deactivate|activate>

Manual development runners (do not change production cron behaviour):
  yarn run:login        # POST /auth/login only
  yarn run:deactivate   # login + PATCH isActive=false
  yarn run:activate     # login + PATCH isActive=true
`;

async function runLogin(): Promise<void> {
  const authClient = createAuthClient();
  const credentials = getLoginCredentials();

  try {
    const result = await authClient.login(credentials);
    logger.info('Manual Dropship login succeeded', {
      email: credentials.email,
      tokenType: result.tokenType ?? null,
      accessTokenLength: result.accessToken.length,
      hasRefreshToken: Boolean(result.refreshToken),
    });
  } catch (error) {
    logger.error('Manual Dropship login failed', {
      email: credentials.email,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  }
}

async function runRoutine(routine: DropshipRoutineName): Promise<void> {
  const service = createToggleDropshipService();

  try {
    const result = await service.run(routine);
    logger.info('Manual Dropship routine completed', result as unknown as Record<string, unknown>);
  } catch (error) {
    logger.error('Manual Dropship routine failed', {
      routine,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === 'login') {
    await runLogin();
    return;
  }

  if (command === 'deactivate' || command === 'activate') {
    await runRoutine(command);
    return;
  }

  console.error(USAGE);
  process.exitCode = 1;
}

void main();
