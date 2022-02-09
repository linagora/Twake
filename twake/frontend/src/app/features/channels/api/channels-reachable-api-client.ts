import Api from '../../global/framework/api-service';
import { ChannelType } from 'app/features/channels/types/channel';
import { TwakeService } from '../../global/framework/registry-decorator-service';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';

type ChannelsReachableGetResponse = { resources: ChannelType[] };
type ChannelsReachableInviteUserResponse = { resource: ChannelMemberType };
type ChannelsReachableInviteUserRequest = {
  resource: {
    user_id: string;
  };
};

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

  /**
   * Add or remove user to/from a channel.
   * Every user in the channel (except guests) can invite or remove someone.
   * A system message will be sent on invitations.
   * @param _companyId string
   * @param _workspaceId string
   * @param _userId string
   *
   */
  async inviteUser(
    companyId: string,
    workspaceId: string,
    channelId: string,
    userId: string,
  ): Promise<ChannelMemberType> {
    return Api.post<ChannelsReachableInviteUserRequest, ChannelsReachableInviteUserResponse>(
      `${this.prefix}/${companyId}/workspaces/${workspaceId}/channels/${channelId}/members/${userId}`,
      {
        resource: {
          user_id: userId,
        },
      },
    ).then(result => result.resource);
  }
}

export default new ChannelsReachableAPIClient();
