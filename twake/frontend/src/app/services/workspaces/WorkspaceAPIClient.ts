import Api from '../Api';
import { CompanyType } from 'app/models/Company';
import { WorkspaceType } from 'app/models/Workspace';
import { TwakeService } from '../Decorators/TwakeService';

const PREFIX = '/internal/services/workspaces/v1/companies';

export type WorkspaceUpdateResource = Pick<WorkspaceType, 'name' | 'logo' | 'default' | 'archived'>;

export type UpdateWorkspaceBody = {
  resource: WorkspaceUpdateResource;
};

@TwakeService('WorkspaceAPIClientService')
class WorkspaceAPIClient {
  /**
   * Get all workspaces for a company
   *
   * @param companyId
   */
  async list(companyId: string): Promise<WorkspaceType[]> {
    return Api.get<{ resources: WorkspaceType[] }>(`${PREFIX}/${companyId}/workspaces`).then(
      result => (result.resources && result.resources.length ? result.resources : []),
    );
  }

  /**
   * Get a workspace
   *
   * @param companyId
   * @param workspaceId
   * @returns
   */
  async get(companyId: string, workspaceId: string): Promise<WorkspaceType> {
    return Api.get<{ resource: WorkspaceType }>(
      `${PREFIX}/${companyId}/workspaces/${workspaceId}`,
    ).then(result => result.resource);
  }

  async delete(companyId: string, workspaceId: string): Promise<WorkspaceType> {
    return Api.delete<{ resource: WorkspaceType }>(
      `${PREFIX}/${companyId}/workspaces/${workspaceId}`,
    ).then(result => result.resource);
  }

  /**
   * Update a given workspace
   *
   * @param companyId
   * @param workspaceId
   * @param workspace
   * @returns the updated workspace
   */
  update(
    companyId: string,
    workspaceId: string,
    workspace: WorkspaceUpdateResource & { logo_b64?: string },
  ): Promise<WorkspaceType> {
    return Api.post<
      UpdateWorkspaceBody & { options?: { logo_b64?: string } },
      { resource: WorkspaceType }
    >(`${PREFIX}/${companyId}/workspaces/${workspaceId}`, {
      resource: workspace,
      options: { logo_b64: workspace?.logo_b64 },
    }).then(result => result.resource);
  }

  /**
   * Get companies for a given user
   *
   * @param userId
   * @returns
   */
  async listCompanies(userId: string): Promise<CompanyType[]> {
    return Api.get<{ resources: CompanyType[] }>(
      `/internal/services/users/v1/users/${userId}/companies`,
    ).then(result => result.resources);
  }
}

export default new WorkspaceAPIClient();
