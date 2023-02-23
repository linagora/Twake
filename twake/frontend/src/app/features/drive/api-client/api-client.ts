import Api from '../../global/framework/api-service';
import { DriveItem, DriveItemDetails, DriveItemVersion } from '../types';

let publicLinkToken: null | string = null;
let twakeTabToken: null | string = null;

export const setPublicLinkToken = (token: string | null) => {
  publicLinkToken = token;
};

export const setTwakeTabToken = (token: string | null) => {
  twakeTabToken = token;
};

const appendPublicAndTwakeToken = (useAnd?: boolean) => {
  if (publicLinkToken) {
    return `${useAnd ? '&' : '?'}public_token=${publicLinkToken}`;
  }
  if (twakeTabToken) {
    return `${useAnd ? '&' : '?'}twake_tab_token=${twakeTabToken}`;
  }
  return '';
};

export class DriveApiClient {
  static async get(companyId: string, id: string | 'trash' | '') {
    return await Api.get<DriveItemDetails>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}${appendPublicAndTwakeToken()}`,
    );
  }

  static async remove(companyId: string, id: string | 'trash' | '') {
    return await Api.delete<void>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}${appendPublicAndTwakeToken()}`,
    );
  }

  static async update(companyId: string, id: string, update: Partial<DriveItem>) {
    return await Api.post<Partial<DriveItem>, DriveItem>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}${appendPublicAndTwakeToken()}`,
      update,
    );
  }

  static async create(
    companyId: string,
    data: { item: Partial<DriveItem>; version?: Partial<DriveItemVersion> },
  ) {
    if (!data.version) data.version = {} as Partial<DriveItemVersion>;
    return await Api.post<
      { item: Partial<DriveItem>; version: Partial<DriveItemVersion> },
      DriveItem
    >(
      `/internal/services/documents/v1/companies/${companyId}/item${appendPublicAndTwakeToken()}`,
      data as { item: Partial<DriveItem>; version: Partial<DriveItemVersion> },
    );
  }

  static async createVersion(companyId: string, id: string, version: Partial<DriveItemVersion>) {
    return await Api.post<Partial<DriveItemVersion>, DriveItemVersion>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}/version${appendPublicAndTwakeToken()}`,
      version,
    );
  }

  static async getDownloadToken(companyId: string, ids: string[], versionId?: string) {
    return Api.get<{ token: string }>(
      `/internal/services/documents/v1/companies/${companyId}/item/download/token` +
        `?items=${ids.join(',')}&version_id=${versionId}` +
        appendPublicAndTwakeToken(true),
    );
  }

  static async getDownloadUrl(companyId: string, id: string, versionId?: string) {
    const { token } = await DriveApiClient.getDownloadToken(companyId, [id], versionId);
    if (versionId)
      return Api.route(
        `/internal/services/documents/v1/companies/${companyId}/item/${id}/download?version_id=${versionId}&token=${token}${appendPublicAndTwakeToken(
          true,
        )}`,
      );
    return Api.route(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}/download?token=${token}${appendPublicAndTwakeToken(
        true,
      )}`,
    );
  }

  static async getDownloadZipUrl(companyId: string, ids: string[]) {
    const { token } = await DriveApiClient.getDownloadToken(companyId, ids);
    return Api.route(
      `/internal/services/documents/v1/companies/${companyId}/item/download/zip` +
        `?items=${ids.join(',')}&token=${token}` +
        appendPublicAndTwakeToken(true),
    );
  }
}
