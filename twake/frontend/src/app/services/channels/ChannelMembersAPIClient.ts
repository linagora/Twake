import { ChannelMemberType } from 'app/models/Channel';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';

type ChannelMembersSaveRequest = { resource: Partial<ChannelMemberType> };
type ChannelMembersSaveResponse = { resource: ChannelMemberType };

@TwakeService('ChannelMembersAPIClientService')
class ChannelMembersAPIClient {
  private readonly prefix = '/internal/services/channels/v1/companies';

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
    );
  }
}

export default new ChannelMembersAPIClient();
