import { CompanyType } from 'app/models/Company';
import { WorkspaceType } from 'app/models/Workspace';
import Api from './Api';
import { TwakeService } from './Decorators/TwakeService';

const PREFIX = '/internal/services/users/v1';

export type WorkspaceUpdateResource = Pick<WorkspaceType, 'name' | 'logo' | 'default' | 'archived'>;

export type UpdateWorkspaceBody = {
  resource: WorkspaceUpdateResource;
};

@TwakeService('CompanyAPIClientService')
class CompanyAPIClient {
  /**
   * Get a list of companies for a user, only common companies with current user are returned.
   
   * @param companyId
   */
  async listCompanies(userId: string): Promise<CompanyType[]> {
    return Api.get<{ resources: CompanyType[] }>(`${PREFIX}/users/${userId}/companies`).then(
      result => (result.resources && result.resources.length ? result.resources : []),
    );
  }

  /**
   * Get a company by id and public information (this route is public and doesn't need to be authenticated)
   *
   * @param companyId
   */
  async get(companyId: string): Promise<CompanyType> {
    return Api.get<{ resource: CompanyType }>(`${PREFIX}/companies/${companyId}`).then(
      a => a.resource,
    );
  }
}

export default new CompanyAPIClient();
