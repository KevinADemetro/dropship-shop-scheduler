import { buildUpdateShopPayload, scheduleConfig, ShopIdentity } from '../config/schedule';
import { assertSuccessStatus, HttpClient } from './http-client';

export interface UpdateShopParams {
  accessToken: string;
  merchantCode: string;
  isActive: boolean;
  shop?: ShopIdentity;
  countryCode?: string;
}

export interface ListShopsParams {
  accessToken: string;
  merchantCode: string;
  countryCode?: string;
}

/**
 * Calls the existing merchants-api order-split routes used by Fulfillment Priority
 * (`GET|PATCH merchants/order-split/shops`).
 */
export class ShopsClient {
  constructor(private readonly http: HttpClient) {}

  /** Dev/test helper — not used by the cron scheduler. */
  async listOrderSplitShops(params: ListShopsParams): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `${scheduleConfig.routes.updateShop}?merchantCode=${encodeURIComponent(params.merchantCode)}`,
      headers: authHeaders(params.accessToken, params.countryCode),
    });

    assertSuccessStatus(response.status, 'List order-split shops', response.data);
    return response.data;
  }

  async updateDropshipActive(params: UpdateShopParams): Promise<unknown> {
    const payload = buildUpdateShopPayload({
      merchantCode: params.merchantCode,
      isActive: params.isActive,
      shop: params.shop ?? scheduleConfig.shop,
    });

    const response = await this.http.request({
      method: 'PATCH',
      path: scheduleConfig.routes.updateShop,
      data: payload,
      headers: {
        ...authHeaders(params.accessToken, params.countryCode),
        'Content-Type': 'application/json',
      },
    });

    assertSuccessStatus(response.status, 'Update order-split shop', response.data);
    return response.data;
  }
}

function authHeaders(accessToken: string, countryCode?: string): Record<string, string> {
  // Matches incycle-web: Authorization is the raw Kong access token (no Bearer prefix).
  const headers: Record<string, string> = {
    Authorization: accessToken,
  };

  if (countryCode) {
    headers['x-country-code'] = countryCode;
  }

  return headers;
}
