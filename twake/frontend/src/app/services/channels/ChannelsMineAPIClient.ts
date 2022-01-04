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
  async get(
    context: { companyId: string; workspaceId?: string },
    options?: { direct: boolean },
  ): Promise<ChannelType[]> {
    return Api.get<ChannelsMineGetResponse>(
      `${this.prefix}/${context.companyId}/workspaces/${
        context.workspaceId && !options?.direct ? context.workspaceId : 'direct'
      }/channels?mine=true`,
    ).then(result => result.resources);
  }
}

export default new ChannelsMineAPIClient();
