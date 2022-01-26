import Api from '../../../services/Api';
import { CompanyType } from 'app/features/companies/types/company';
import { WorkspaceType } from 'app/features/workspaces/types/workspace';
import { TwakeService } from '../../global/services/twake-service';
import { WebsocketRoom } from '../../../services/WebSocket/WebSocket';

const PREFIX = '/internal/services/workspaces/v1/companies';

export type WorkspaceUpdateResource = Partial<WorkspaceType & { logo_b64?: string }>;

export type UpdateWorkspaceBody = {
  resource: WorkspaceUpdateResource;
};

@TwakeService('WorkspaceAPIClientService')
class WorkspaceAPIClient {
  private realtime: Map<string, WebsocketRoom[]> = new Map();

  websockets(companyId: string): WebsocketRoom[] {
    return this.realtime.get(companyId) || [];
  }

  /**
   * Get all workspaces for a company
   *
   * @param companyId
   */
  async list(companyId: string): Promise<WorkspaceType[]> {
    return Api.get<{ resources: WorkspaceType[]; websockets: WebsocketRoom[] }>(
      `${PREFIX}/${companyId}/workspaces?websockets=1`,
    ).then(result => {
      this.realtime.set(companyId, result.websockets);
      return result.resources && result.resources.length ? result.resources : [];
    });
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

  /**
   * Create a workspace
   *
   * @param companyId
   * @param workspace
   * @returns the updated workspace
   */
  async create(companyId: string, workspace: WorkspaceUpdateResource): Promise<WorkspaceType> {
    return Api.post<UpdateWorkspaceBody, { resource: WorkspaceType }>(
      `${PREFIX}/${companyId}/workspaces`,
      { resource: workspace },
    ).then(result => result.resource);
  }

  /**
   * Delete a workspace
   *
   * @param companyId
   * @param workspace
   * @returns the updated workspace
   */
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
    workspace: WorkspaceUpdateResource,
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
