import { CompanyType } from 'app/models/Company';
import { WorkspaceType } from 'app/models/Workspace';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';

const PREFIX = '/internal/services/workspaces/v1/companies';

@TwakeService('WorkspaceAPIClientService')
class WorkspaceAPIClient {

  /**
   * Get all workspaces for a company
   *
   * @param companyId
   */
  async list(companyId: string): Promise<WorkspaceType[]> {
    return Api.get<{ resources: WorkspaceType[]}>(
      `${PREFIX}/${companyId}/workspaces`,
    )
    .then(result => result.resources && result.resources.length ? result.resources : []);
  }

  /**
   * Get a workspace
   *
   * @param companyId
   * @param workspaceId
   * @returns
   */
  async get(companyId: string, workspaceId: string): Promise<WorkspaceType> {
    return Api.get<{ resource: WorkspaceType}>(
      `${PREFIX}/${companyId}/workspaces/${workspaceId}`,
    )
    .then(result => result.resource);

  }

  /**
   * Get companies for a given user
   *
   * @param userId
   * @returns
   */
  async listCompanies(userId: string): Promise<CompanyType[]> {
    return Api.get<{ resources: CompanyType[]}>(
      `/internal/services/users/v1/users/${userId}/companies`,
    )
    .then(result => result.resources);
  }
}

export default new WorkspaceAPIClient();
