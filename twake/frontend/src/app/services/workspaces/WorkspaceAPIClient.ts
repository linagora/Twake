import { CompanyType } from 'app/models/Company';
import { WorkspaceType } from 'app/models/Workspace';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';

@TwakeService('WorkspaceAPIClientService')
class WorkspaceAPIClient {

  /**
   * Get all workspaces for a company
   *
   * @param id
   */
  async list(companyId: string): Promise<WorkspaceType[]> {
    return Api.get<{ resources: WorkspaceType[]}>(
      `/internal/services/workspaces/v1/companies/${companyId}/workspaces`,
    )
    .then(result => result.resources && result.resources.length ? result.resources : []);
  }

  async listCompanies(userId: string): Promise<CompanyType[]> {
    return Api.get<{ resources: CompanyType[]}>(
      `/internal/services/users/v1/users/${userId}/companies`,
    )
    .then(result => result.resources);
  }
}

export default new WorkspaceAPIClient();
