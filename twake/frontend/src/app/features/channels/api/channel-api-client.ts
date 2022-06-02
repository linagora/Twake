import Api from '../../global/framework/api-service';
import { ChannelType } from 'app/features/channels/types/channel';
import { TwakeService } from '../../global/framework/registry-decorator-service';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import { removeBadgesNow } from 'app/features/users/hooks/use-notifications';

import Workspaces from 'deprecated/workspaces/workspaces';
const PREFIX = '/internal/services/channels/v1/companies';

@TwakeService('ChannelAPIClientService')
class ChannelAPIClientService {
  async getDirect(companyId: string, membersId: string[]) {
    return Api.post<{ options: { members: string[] }; resource: any }, { resource: ChannelType }>(
      `${PREFIX}/${companyId}/workspaces/direct/channels`,
      { options: { members: membersId }, resource: {} },
    ).then(result => result.resource);
  }

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
    { status = true, requireFocus = false, now = false },
  ): Promise<void> {
    if (requireFocus && !document.hasFocus()) return;

    if (status) removeBadgesNow('channel', channelId);

    delayRequest(
      'reach-end-read-channel-' + channelId,
      () =>
        Api.post<{ value: boolean }, void>(
          `${PREFIX}/${companyId}/workspaces/${workspaceId}/channels/${channelId}/read`,
          {
            value: status,
          },
        ),
      { doInitialCall: now, timeout: 2000 },
    );
  }

  async recent(companyId: string, limit: number): Promise<ChannelType[]> {
    try {
      const res = await Api.get<{ resources: ChannelType[] }>(
        `${PREFIX}/${companyId}/channels/recent?limit=${limit}`,
      );

      return res.resources;
    } catch (e) {
      console.error("Can't retrieve channels", e);
      return [];
    }
  }
}

const ChannelAPIClient = new ChannelAPIClientService();
export default ChannelAPIClient;
