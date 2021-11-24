import { TabType } from 'app/models/Tab';
import { TwakeService } from '../Decorators/TwakeService';

@TwakeService('TabsAPIClientService')
class TabsAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';

  async save(
    companyId: string,
    workspaceId: string,
    channelIid: string,
    tabId: string,
  ): Promise<TabType> {
    throw 'not implemented';
  }

  async list(companyId: string, workspaceId: string, channelIid: string): Promise<TabType[]> {
    throw 'not implemented';
  }

  async remove(
    companyId: string,
    workspaceId: string,
    channelIid: string,
    tabId: string,
  ): Promise<TabType> {
    throw 'not implemented';
  }
}

export default new TabsAPIClient();
