import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import { AppType } from 'app/models/App';

const PREFIX = '/internal/services/applications/v1/applications';

@TwakeService('ApplicationsAPIClientService')
class ApplicationsAPIClient {
  /**
   * Search all applications
   */
  async search(search: string = ''): Promise<AppType[]> {
    return Api.get<{ resources: AppType[] }>(`${PREFIX}?search=${search}`).then(result =>
      result.resources && result.resources.length ? result.resources : [],
    );
  }

  /**
   * Get an application
   *
   * @param applicationId
   * @returns
   */
  async get(applicationId: string): Promise<AppType> {
    return Api.get<{ resource: AppType }>(`${PREFIX}/${applicationId}`).then(
      result => result.resource,
    );
  }
}

export default new ApplicationsAPIClient();
