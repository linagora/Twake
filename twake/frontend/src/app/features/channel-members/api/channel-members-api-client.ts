import { ChannelMemberType } from 'app/features/channels/types/channel';
import Api from '../../../services/Api';
import { TwakeService } from '../../global/services/twake-service';

type ChannelMembersSaveRequest = { resource: Partial<ChannelMemberType> };
type ChannelMembersSaveResponse = { resource: ChannelMemberType };

@TwakeService('ChannelMembersAPIClientService')
class ChannelMembersAPIClient {
  private readonly prefix = '/internal/services/channels/v1/companies';

  async get(companyId: string, workspaceId: string, channelId: string) {
    return Api.get<{ resources: ChannelMemberType[] }>(
      `${this.prefix}/${companyId}/workspaces/${workspaceId}/channels/${channelId}/members`,
    ).then(result => result.resources);
  }

  async save(
    channelMember: ChannelMemberType,
    partialsToUpdate: Partial<ChannelMemberType>,
    context: { companyId: string; workspaceId: string; channelId: string; userId: string },
  ) {
    return Api.post<ChannelMembersSaveRequest, ChannelMembersSaveResponse>(
      `${this.prefix}/${context.companyId}/workspaces/${context.workspaceId}/channels/${context.channelId}/members/${context.userId}`,
      {
        resource: { ...channelMember, ...partialsToUpdate },
      },
    ).then(result => result.resource);
  }
}

export default new ChannelMembersAPIClient();
