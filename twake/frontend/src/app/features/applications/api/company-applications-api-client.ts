import Api from '../../global/services/api-service';
import { TwakeService } from '../../global/services/twake-service';
import { Application } from 'app/features/applications/types/application';
import { WebsocketRoom } from '../../../services/WebSocket/WebSocket';

const PREFIX = '/internal/services/applications/v1/companies';

@TwakeService('CompanyApplicationsAPIClientService')
class CompanyApplicationsAPIClient {
  private realtime: Map<string, WebsocketRoom[]> = new Map();

  websockets(companyId: string): WebsocketRoom[] {
    return this.realtime.get(companyId) || [];
  }

  /**
   * Get all applications for a company
   *
   * @param companyId
   */
  async list(companyId: string): Promise<Application[]> {
    return Api.get<{ resources: Application[]; websockets: WebsocketRoom[] }>(
      `${PREFIX}/${companyId}/applications`,
    ).then(result => {
      this.realtime.set(companyId, result.websockets);
      return result.resources && result.resources.length ? result.resources : [];
    });
  }

  /**
   * Get an application in a company
   *
   * @param companyId
   * @param applicationId
   * @returns
   */
  async get(companyId: string, applicationId: string): Promise<Application> {
    return Api.get<{ resource: Application }>(
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
  async add(companyId: string, applicationId: string): Promise<Application> {
    return Api.post<{}, { resource: Application }>(
      `${PREFIX}/${companyId}/applications/${applicationId}`,
      {},
      undefined,
      false,
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
  async remove(companyId: string, applicationId: string): Promise<boolean> {
    return Api.delete<{ resource: { status: 'error' | 'success' } }>(
      `${PREFIX}/${companyId}/applications/${applicationId}`,
    ).then(result => (result.resource?.status === 'success' ? true : false));
  }
}

export default new CompanyApplicationsAPIClient();
