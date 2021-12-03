import Api from '../Api';
import { ChannelType } from 'app/models/Channel';
import { TwakeService } from '../Decorators/TwakeService';

const PREFIX = '/internal/services/channels/v1/companies';

@TwakeService('ChannelAPIClientService')
class ChannelAPIClient {
  async get(companyId: string, workspaceId: string, channelId: string): Promise<ChannelType> {
    return Api.get<{ resource: ChannelType }>(
      `${PREFIX}/${companyId}/workspaces/${workspaceId}/channels/${channelId}`,
    ).then(result => result.resource);
  }
}

export default new ChannelAPIClient();
