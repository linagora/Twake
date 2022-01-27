import Api from '../../global/framework/api-service';
import { TwakeService } from '../../global/framework/registry-decorator-service';
import { Application } from 'app/features/applications/types/application';

const PREFIX = '/internal/services/applications/v1/applications';

@TwakeService('ApplicationsAPIClientService')
class ApplicationsAPIClient {
  /**
   * Search all applications
   */
  async search(search?: string): Promise<Application[]> {
    return Api.get<{ resources: Application[] }>(
      `${PREFIX}${search ? `?search=${search}` : ''}`,
    ).then(result => (result.resources && result.resources.length ? result.resources : []));
  }

  /**
   * Get an application
   *
   * @param applicationId
   * @returns
   */
  async get(applicationId: string): Promise<Application> {
    return Api.get<{ resource: Application }>(`${PREFIX}/${applicationId}`).then(
      result => result.resource,
    );
  }
}

export default new ApplicationsAPIClient();
