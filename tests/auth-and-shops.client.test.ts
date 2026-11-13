import { AuthClient } from '../src/clients/auth.client';
import { HttpClient, HttpClientError } from '../src/clients/http-client';
import { ShopsClient } from '../src/clients/shops.client';

describe('AuthClient / ShopsClient', () => {
  it('posts login credentials to /auth/login and returns the access token', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        data: { accessToken: ' abc123 ', tokenType: 'bearer' },
      }),
    } as unknown as HttpClient;

    const client = new AuthClient(http);
    const result = await client.login({
      email: 'a@b.com',
      password: 'x',
      countryCode: 'us',
      consumerUsername: 'centralizer_website',
    });

    expect(http.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/auth/login',
      data: {
        email: 'a@b.com',
        password: 'x',
        countryCode: 'us',
        consumerUsername: 'centralizer_website',
      },
    });
    expect(result.accessToken).toBe('abc123');
  });

  it('rejects unexpected login responses', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({ status: 200, data: {} }),
    } as unknown as HttpClient;

    await expect(
      new AuthClient(http).login({
        email: 'a@b.com',
        password: 'x',
        countryCode: 'us',
        consumerUsername: 'centralizer_website',
      }),
    ).rejects.toBeInstanceOf(HttpClientError);
  });

  it('gets merchants/order-split/shops filtered by merchantCode', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({ status: 200, data: { shops: [] } }),
    } as unknown as HttpClient;

    await new ShopsClient(http).listOrderSplitShops({
      accessToken: 'token-1',
      merchantCode: 'Sandbox',
      countryCode: 'us',
    });

    expect(http.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/merchants/order-split/shops?merchantCode=Sandbox',
      headers: {
        Authorization: 'token-1',
        'x-country-code': 'us',
      },
    });
  });

  it('patches merchants/order-split/shops with Authorization and isActive payload', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({ status: 200, data: { results: [] } }),
    } as unknown as HttpClient;

    await new ShopsClient(http).updateDropshipActive({
      accessToken: 'token-1',
      merchantCode: 'Incycle',
      isActive: false,
      countryCode: 'us',
    });

    expect(http.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/merchants/order-split/shops',
      data: {
        shops: [
          {
            merchantCode: 'Incycle',
            tenantName: 'Dropship',
            shopID: 'dropship',
            isActive: false,
          },
        ],
      },
      headers: {
        Authorization: 'token-1',
        'Content-Type': 'application/json',
        'x-country-code': 'us',
      },
    });
  });

  it('throws on non-2xx shop update responses', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({ status: 403, data: { message: 'forbidden' } }),
    } as unknown as HttpClient;

    await expect(
      new ShopsClient(http).updateDropshipActive({
        accessToken: 'token-1',
        merchantCode: 'Incycle',
        isActive: true,
      }),
    ).rejects.toThrow(/HTTP 403/);
  });
});
