import { TabType } from 'app/models/Tab';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';

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
    console.log('+++++++++++coucou', response.resource);
    return response.resource;
  }

  async list(companyId: string, workspaceId: string, channelId: string): Promise<TabType[]> {
    const response = await Api.get<{ resources: TabType[] }>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs`,
    );

    console.log('+++++++++++salut', response.resources);

    return response.resources;
  }

  async remove(
    companyId: string,
    workspaceId: string,
    channelId: string,
    tabId: string,
  ): Promise<boolean> {
    const response = await Api.delete<any>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/${tabId}`,
    );
    console.log('+++++++++++bye', response);

    return true;
  }
}

export default new TabsAPIClient();
