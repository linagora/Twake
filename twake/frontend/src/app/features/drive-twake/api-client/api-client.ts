import Api from '../../global/framework/api-service';
import { DriveTwakeTab } from '../types';

export class DriveTwakeApiClient {
  static async getTab(companyId: string, tabId: string) {
    return await Api.get<DriveTwakeTab>(
      `/internal/services/documents/v1/companies/${companyId}/tab/${tabId}`,
    );
  }

  static async setTab(companyId: string, tabId: string, itemId: string) {
    return await Api.post<DriveTwakeTab, DriveTwakeTab>(
      `/internal/services/documents/v1/companies/${companyId}/tab/${tabId}`,
      {
        company_id: companyId,
        tab_id: tabId,
        item_id: itemId,
      },
    );
  }
}
