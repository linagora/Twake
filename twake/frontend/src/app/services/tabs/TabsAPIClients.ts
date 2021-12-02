import { TabType } from 'app/models/Tab';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';

@TwakeService('TabsAPIClientService')
class TabsAPIClient {
  private readonly prefixUrl: string = '/internal/services/channels/v1';
  private realtime: Map<string, any[]> = new Map();

  websockets(channelId: string) {
    return this.realtime.get(channelId) || [];
  }

  async save(companyId: string, workspaceId: string, channelId: string, tab: TabType) {
    await Api.post<{ resource: TabType }, { resource: TabType }>(
      `${
        this.prefixUrl
      }/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs${
        tab.id ? '/' + tab.id : ''
      }`,
      { resource: tab },
    );
  }

  async list(companyId: string, workspaceId: string, channelId: string): Promise<TabType[]> {
    const response = await Api.get<{ resources: TabType[]; websockets: any[] }>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs?websockets=1`,
    );
    this.realtime.set(channelId, response.websockets);
    return response.resources && response.resources.length ? response.resources : [];
  }

  async remove(companyId: string, workspaceId: string, channelId: string, tabId: string) {
    await Api.delete<any>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/${tabId}`,
    );
  }
}

export default new TabsAPIClient();
