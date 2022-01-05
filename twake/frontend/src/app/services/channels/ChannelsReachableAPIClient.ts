import Api from '../Api';
import { ChannelType } from 'app/models/Channel';
import { TwakeService } from '../Decorators/TwakeService';

type ChannelsReachableGetResponse = { resources: ChannelType[] };

@TwakeService('ChannelsReachableAPIClientService')
class ChannelsReachableAPIClient {
  private readonly prefix = '/internal/services/channels/v1/companies';

  /**
   * @param companyId
   * @param workspaceId
   * @return channels that user is not a member but could join
   */
  async get(companyId: string, workspaceId: string): Promise<ChannelType[]> {
    return Api.get<ChannelsReachableGetResponse>(
      `${this.prefix}/${companyId}/workspaces/${workspaceId}/channels`,
    ).then(result => result.resources);
  }
}

export default new ChannelsReachableAPIClient();
