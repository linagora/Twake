import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import { AppType } from 'app/models/App';

const PREFIX = '/internal/services/applications/v1/companies';

@TwakeService('CompanyApplicationsAPIClientService')
class CompanyApplicationsAPIClient {
  /**
   * Get all applications for a company
   *
   * @param companyId
   */
  async list(companyId: string): Promise<AppType[]> {
    return Api.get<{ resources: AppType[] }>(`${PREFIX}/${companyId}/applications`).then(result =>
      result.resources && result.resources.length ? result.resources : [],
    );
  }

  /**
   * Get an application in a company
   *
   * @param companyId
   * @param applicationId
   * @returns
   */
  async get(companyId: string, applicationId: string): Promise<AppType> {
    return Api.get<{ resource: AppType }>(
      `${PREFIX}/${companyId}/applications/${applicationId}`,
    ).then(result => result.resource);
  }

  /**
   * Add an application in a company
   *
   * @param companyId
   * @param applicationId
   * @returns
   */
  async add(companyId: string, applicationId: string): Promise<AppType> {
    return Api.post<{}, { resource: AppType }>(
      `${PREFIX}/${companyId}/applications/${applicationId}`,
      {},
    ).then(result => result.resource);
  }

  /**
   * Remove an application from a company
   *
   * @param companyId
   * @param applicationId
   * @returns
   */
  async remove(companyId: string, applicationId: string): Promise<AppType> {
    return Api.delete<{ resource: AppType }>(
      `${PREFIX}/${companyId}/applications/${applicationId}`,
    ).then(result => result.resource);
  }
}

export default new CompanyApplicationsAPIClient();
