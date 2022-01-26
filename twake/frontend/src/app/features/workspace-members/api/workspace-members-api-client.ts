import Api from '../../global/framework/api-service';
import { WorkspaceUserType } from 'app/features/workspaces/types/workspace';
import { TwakeService } from '../../global/framework/registry-decorator-service';

const PREFIX = '/internal/services/workspaces/v1/companies';

@TwakeService('WorkspaceUserAPIClientService')
class WorkspaceUserAPIClient {
  /**
   * Get all workspace users
   *
   * @param companyId
   * @param workspaceId
   * @returns Promise<WorkspaceUserType[]
   */
  async list(companyId: string, workspaceId: string): Promise<WorkspaceUserType[]> {
    const workspaceUsersRoute = `${PREFIX}/${companyId}/workspaces/${workspaceId}/users`;
    return Api.get<{ resources: WorkspaceUserType[] }>(workspaceUsersRoute).then(result =>
      result.resources && result.resources.length ? result.resources : [],
    );
  }

  /**
   * Get a workspace user
   *
   * @param companyId
   * @param workspaceId
   * @returns Promise<WorkspaceUserType>
   */
  async get(companyId: string, workspaceId: string, userId: string): Promise<WorkspaceUserType> {
    return Api.get<{ resource: WorkspaceUserType }>(
      `${PREFIX}/${companyId}/workspaces/${workspaceId}/users/${userId}`,
    ).then(result => result.resource);
  }
}

export default new WorkspaceUserAPIClient();
