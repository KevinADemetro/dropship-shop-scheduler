import { AuthClient } from '../src/clients/auth.client';
import { HttpClientError } from '../src/clients/http-client';
import { ShopsClient } from '../src/clients/shops.client';
import { ToggleDropshipService } from '../src/services/toggle-dropship.service';

describe('ToggleDropshipService', () => {
  const credentials = {
    email: 'scheduler@example.com',
    password: 'secret',
    countryCode: 'us',
    consumerUsername: 'centralizer_website',
  };

  let authClient: jest.Mocked<Pick<AuthClient, 'login'>>;
  let shopsClient: jest.Mocked<Pick<ShopsClient, 'updateDropshipActive'>>;
  let service: ToggleDropshipService;

  beforeEach(() => {
    authClient = { login: jest.fn() };
    shopsClient = { updateDropshipActive: jest.fn() };
    service = new ToggleDropshipService({
      authClient: authClient as unknown as AuthClient,
      shopsClient: shopsClient as unknown as ShopsClient,
      credentials,
      merchantCode: 'Incycle',
    });
  });

  it('logs in before deactivating Dropship with isActive false', async () => {
    authClient.login.mockResolvedValue({ accessToken: 'token-deactivate' });
    shopsClient.updateDropshipActive.mockResolvedValue({ results: [] });

    const result = await service.run('deactivate');

    expect(authClient.login).toHaveBeenCalledWith(credentials);
    expect(shopsClient.updateDropshipActive).toHaveBeenCalledWith({
      accessToken: 'token-deactivate',
      merchantCode: 'Incycle',
      isActive: false,
      countryCode: 'us',
    });
    expect(result).toMatchObject({
      routine: 'deactivate',
      isActive: false,
      loginSucceeded: true,
      updateSucceeded: true,
    });
  });

  it('logs in again before activating Dropship with isActive true', async () => {
    authClient.login.mockResolvedValue({ accessToken: 'token-activate' });
    shopsClient.updateDropshipActive.mockResolvedValue({ results: [] });

    const result = await service.run('activate');

    expect(authClient.login).toHaveBeenCalledTimes(1);
    expect(shopsClient.updateDropshipActive).toHaveBeenCalledWith({
      accessToken: 'token-activate',
      merchantCode: 'Incycle',
      isActive: true,
      countryCode: 'us',
    });
    expect(result.isActive).toBe(true);
  });

  it('does not update the shop when login fails', async () => {
    authClient.login.mockRejectedValue(
      new HttpClientError('Login failed with HTTP 401', { status: 401, responseBody: { message: 'Invalid password' } }),
    );

    await expect(service.run('deactivate')).rejects.toThrow(/Login failed/);
    expect(shopsClient.updateDropshipActive).not.toHaveBeenCalled();
  });

  it('propagates HTTP errors from the shop update', async () => {
    authClient.login.mockResolvedValue({ accessToken: 'token-ok' });
    shopsClient.updateDropshipActive.mockRejectedValue(
      new HttpClientError('Update order-split shop failed with HTTP 500', {
        status: 500,
        responseBody: { message: 'boom' },
      }),
    );

    await expect(service.run('activate')).rejects.toThrow(/HTTP 500/);
  });
});
