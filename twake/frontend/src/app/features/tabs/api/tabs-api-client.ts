import { TabType } from 'app/features/tabs/types/tab';
import Api from '../../global/services/api-service';
import { TwakeService } from '../../global/services/twake-service';
import { WebsocketRoom } from '../../../services/WebSocket/WebSocket';

type TabKey = {
  companyId: string;
  workspaceId: string;
  channelId: string;
};

@TwakeService('TabsAPIClientService')
class TabsAPIClient {
  private readonly prefixUrl: string = '/internal/services/channels/v1';
  private realtime: Map<string, WebsocketRoom[]> = new Map();

  websockets(channelId: string) {
    return this.realtime.get(channelId) || [];
  }

  async save({ companyId, workspaceId, channelId }: TabKey, tab: TabType) {
    await Api.post<{ resource: TabType }, { resource: TabType }>(
      `${
        this.prefixUrl
      }/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs${
        tab.id ? '/' + tab.id : ''
      }`,
      { resource: tab },
    );
  }

  async list({ companyId, workspaceId, channelId }: TabKey): Promise<TabType[]> {
    const response = await Api.get<{ resources: TabType[]; websockets: WebsocketRoom[] }>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs?websockets=1`,
    );
    this.realtime.set(channelId, response.websockets);
    return response.resources && response.resources.length ? response.resources : [];
  }

  async remove({ companyId, workspaceId, channelId }: TabKey, tabId: string) {
    await Api.delete<any>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/${tabId}`,
    );
  }
}

export default new TabsAPIClient();
