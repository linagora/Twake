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

  async save(
    channel: ChannelType,
    context: { companyId: string; workspaceId: string; channelId?: string },
  ) {
    return Api.post<{ resource: ChannelType }, { resource: ChannelType }>(
      `${PREFIX}/${context.companyId}/workspaces/${context.workspaceId}/channels${
        context?.channelId ? `/${context.channelId}` : ''
      }`,
      {
        resource: channel,
      },
    ).then(result => result.resource);
  }

  async read(
    companyId: string,
    workspaceId: string,
    channelId: string,
    { status = true, requireFocus = false },
  ): Promise<void> {
    if (requireFocus && !document.hasFocus()) return;
    return Api.post<{ value: boolean }, void>(
      `${PREFIX}/${companyId}/workspaces/${workspaceId}/channels/${channelId}/read`,
      {
        value: status,
      },
    );
  }
}

export default new ChannelAPIClient();
