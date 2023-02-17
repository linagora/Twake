import Api from '../../global/framework/api-service';
import { DriveItem, DriveItemDetails, DriveItemVersion } from '../types';
import Workspace from 'app/deprecated/workspaces/workspaces';
import Logger from 'features/global/framework/logger-service';
export interface BaseSearchOptions {
  company_id?: string;
  workspace_id?: string;
  channel_id?: string;
  page_token?: string;
  limit?: number;
}

export type SearchDocumentsBody = {
  search?: string;
  company_id?: string;
  creator?: string;
  added?: string;
};

let publicLinkToken: null | string = null;

export const setPublicLinkToken = (token: string | null) => {
  publicLinkToken = token;
};

const appendPublicToken = (useAnd?: boolean) => {
  if (publicLinkToken) {
    return `${useAnd ? '&' : '?'}public_token=${publicLinkToken}`;
  }
  return '';
};

export class DriveApiClient {
  private static logger = Logger.getLogger('MessageAPIClientService');
  static async get(companyId: string, id: string | 'trash' | '') {
    return await Api.get<DriveItemDetails>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}${appendPublicToken()}`,
    );
  }

  static async remove(companyId: string, id: string | 'trash' | '') {
    return await Api.delete<void>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}${appendPublicToken()}`,
    );
  }

  static async update(companyId: string, id: string, update: Partial<DriveItem>) {
    return await Api.post<Partial<DriveItem>, DriveItem>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}${appendPublicToken()}`,
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
      `/internal/services/documents/v1/companies/${companyId}/item${appendPublicToken()}`,
      data as { item: Partial<DriveItem>; version: Partial<DriveItemVersion> },
    );
  }

  static async createVersion(companyId: string, id: string, version: Partial<DriveItemVersion>) {
    return await Api.post<Partial<DriveItemVersion>, DriveItemVersion>(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}/version${appendPublicToken()}`,
      version,
    );
  }

  static async getDownloadToken(companyId: string, ids: string[], versionId?: string) {
    return Api.get<{ token: string }>(
      `/internal/services/documents/v1/companies/${companyId}/item/download/token` +
        `?items=${ids.join(',')}&version_id=${versionId}` +
        appendPublicToken(true),
    );
  }

  static async getDownloadUrl(companyId: string, id: string, versionId?: string) {
    const { token } = await DriveApiClient.getDownloadToken(companyId, [id], versionId);
    if (versionId)
      return Api.route(
        `/internal/services/documents/v1/companies/${companyId}/item/${id}/download?version_id=${versionId}&token=${token}${appendPublicToken(
          true,
        )}`,
      );
    return Api.route(
      `/internal/services/documents/v1/companies/${companyId}/item/${id}/download?token=${token}${appendPublicToken(
        true,
      )}`,
    );
  }

  static async getDownloadZipUrl(companyId: string, ids: string[]) {
    const { token } = await DriveApiClient.getDownloadToken(companyId, ids);
    return Api.route(
      `/internal/services/documents/v1/companies/${companyId}/item/download/zip` +
        `?items=${ids.join(',')}&token=${token}` +
        appendPublicToken(true),
    );
  }

  static async search(searchString: string, options?: BaseSearchOptions) {
    const companyId = options?.company_id ? options.company_id : Workspace.currentGroupId;
    const query = `/internal/services/messages/v1/companies/${companyId}/search?q=${searchString}&include_users=1`;
    const res = await Api.post<SearchDocumentsBody,{ resources: DriveItem[] }>(query, {});
    this.logger.debug(
      `Drive search by text "${searchString}". Found`,
      res.resources.length,
      'drive item(s)',
    );

    return res;
  }
}
