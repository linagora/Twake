import { TabType } from 'app/models/Tab';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import { WebsocketRoomActions } from '../WebSocket/WebSocket';

export declare type DeleteStatus = 'success' | 'error';

@TwakeService('TabsAPIClientService')
class TabsAPIClient {
  private readonly prefixUrl: string = '/internal/services/channels/v1';

  async save(
    companyId: string,
    workspaceId: string,
    channelId: string,
    tab: TabType,
  ): Promise<TabType> {
    const response = await Api.post<{ resource: TabType }, { resource: TabType }>(
      `${
        this.prefixUrl
      }/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs${
        tab.id ? '/' + tab.id : ''
      }`,
      { resource: tab },
    );
    console.log('+++++++++++APICLient save : ', response.resource);
    return response.resource;
  }

  async list(companyId: string, workspaceId: string, channelId: string): Promise<TabType[]> {
    const response = await Api.get<{ resources: TabType[]; websockets: WebsocketRoomActions }>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs?websockets=1`,
    );
    console.log('+++++++++++APICLient list : ', response.websockets);
    return response.resources;
  }

  async remove(companyId: string, workspaceId: string, channelId: string, tabId: string) {
    const response = await Api.delete<any>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/${tabId}`,
    );
    console.log('+++++++++++APIClient remove : ', response);
  }
}

export default new TabsAPIClient();
