import Api from '../Api';
import { ChannelType } from 'app/models/Channel';
import { TwakeService } from '../Decorators/TwakeService';

type ChannelsMineGetResponse = { resources: ChannelType[] };

@TwakeService('ChannelsMineAPIClientService')
class ChannelsMineAPIClient {
  private readonly prefix = '/internal/services/channels/v1/companies';

  /**
   * @param companyId
   * @param workspaceId
   * @return channels that user is already a member
   */
  async get(companyId: string, workspaceId: string): Promise<ChannelType[]> {
    return Api.get<ChannelsMineGetResponse>(
      `${this.prefix}/${companyId}/workspaces/${workspaceId}/channels?mine=true`,
    ).then(result => result.resources);
  }
}

export default new ChannelsMineAPIClient();
