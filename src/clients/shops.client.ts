import { buildUpdateShopPayload, scheduleConfig, ShopIdentity } from '../config/schedule';
import { assertSuccessStatus, HttpClient } from './http-client';

export interface UpdateShopParams {
  accessToken: string;
  merchantCode: string;
  isActive: boolean;
  shop?: ShopIdentity;
  countryCode?: string;
}

/**
 * Calls the existing merchants-api order-split update route used by Fulfillment Priority
 * (`PATCH merchants/order-split/shops`).
 */
export class ShopsClient {
  constructor(private readonly http: HttpClient) {}

  async updateDropshipActive(params: UpdateShopParams): Promise<unknown> {
    const payload = buildUpdateShopPayload({
      merchantCode: params.merchantCode,
      isActive: params.isActive,
      shop: params.shop ?? scheduleConfig.shop,
    });

    const headers: Record<string, string> = {
      // Matches incycle-web: Authorization is the raw Kong access token (no Bearer prefix).
      Authorization: params.accessToken,
      'Content-Type': 'application/json',
    };

    if (params.countryCode) {
      headers['x-country-code'] = params.countryCode;
    }

    const response = await this.http.request({
      method: 'PATCH',
      path: scheduleConfig.routes.updateShop,
      data: payload,
      headers,
    });

    assertSuccessStatus(response.status, 'Update order-split shop', response.data);
    return response.data;
  }
}
