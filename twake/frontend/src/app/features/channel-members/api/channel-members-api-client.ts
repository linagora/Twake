import Api from '../../global/framework/api-service';
import { TwakeService } from '../../global/framework/registry-decorator-service';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';

type ChannelMembersSaveRequest = { resource: Partial<ChannelMemberType> };
type ChannelMembersSaveResponse = { resource: ChannelMemberType };

@TwakeService('ChannelMembersAPIClientService')
class ChannelMembersAPIClientService {
  private readonly prefix = '/internal/services/channels/v1/companies';

  /**
   * Every member of the channel can list members of the channel.
   * This returns a list of members in a channel.
   *
   * @param companyId string
   * @param workspaceId string
   * @param channelId string
   * @returns ChannelMemberType[]
   */
  async list(companyId: string, workspaceId: string, channelId: string) {
    return Api.get<{ resources: ChannelMemberType[] }>(
      `${this.prefix}/${companyId}/workspaces/${workspaceId}/channels/${channelId}/members`,
    ).then(result => result.resources);
  }

  /**
   * Channel member can update their own preferences
   *
   * @param channelMember ChannelMemberType
   * @param partialsToUpdate Partial ChannelMemberType
   * @param context Execution context of the update
   */
  async updateChannelMemberPreferences(
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
const ChannelMembersAPIClient = new ChannelMembersAPIClientService();

export default ChannelMembersAPIClient;
