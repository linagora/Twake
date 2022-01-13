import Api from '../Api';
import { ChannelMemberType, ChannelType } from 'app/models/Channel';
import { TwakeService } from '../Decorators/TwakeService';
import { WebsocketRoom } from '../WebSocket/WebSocket';

type ChannelsMineGetResponse = { resources: ChannelType[]; websockets: WebsocketRoom[] };
type ChannelsMineDeleteBaseResponse = {
  statusCode: number;
  error: string;
  message: string;
};

@TwakeService('ChannelsMineAPIClientService')
class ChannelsMineAPIClient {
  private readonly prefix = '/internal/services/channels/v1/companies';
  private readonly realtime: Map<string, WebsocketRoom[]> = new Map();

  websockets(companyId: string, workspaceId: string): WebsocketRoom[] {
    return this.realtime.get(this.getRealtimeKey(companyId, workspaceId)) || [];
  }

  getRealtimeKey(companyId: string, workspaceId: string) {
    return `/companies/${companyId}/workspaces/${workspaceId}/channels`;
  }

  async save(
    channel: ChannelType,
    context: { companyId: string; workspaceId: string; channelId?: string },
  ) {
    return Api.post<{ resource: ChannelType }, { resource: ChannelType }>(
      `${this.prefix}/${context.companyId}/workspaces/${context.workspaceId}/channels${
        context?.channelId ? `/${context.channelId}` : ''
      }`,
      {
        resource: channel,
      },
    ).then(result => result.resource);
  }

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
      }/channels?mine=1&websockets=1`,
    ).then(result => {
      context.workspaceId &&
        this.realtime.set(
          this.getRealtimeKey(context.companyId, context.workspaceId),
          result.websockets,
        );
      return result.resources;
    });
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
    _companyId: string,
    _workspaceId: string,
    _userId: string,
  ): Promise<ChannelMemberType> {
    throw new Error('Not implemented yet');
  }

  /**
   * Remove user from a channel.
   * Every user in the channel (except guests) can remove an user.
   * A system message will be sent.
   * We cannot call this route for direct channels.
   * @param userId string
   * @param context companyId - workspaceId - channelId
   */
  async removeUser(
    userId: string,
    context: { companyId: string; workspaceId: string; channelId: string },
  ): Promise<ChannelsMineDeleteBaseResponse> {
    return Api.delete<ChannelsMineDeleteBaseResponse>(
      `${this.prefix}/${context.companyId}/workspaces/${context.workspaceId}/channels/${context.channelId}/members/${userId}`,
    );
  }

  /**
   * Remove a channel, this action is not reversible.
   * Direct channels can not be removed.
   * Only administrators and channel owner can remove a channel.
   * @param companyId string
   * @param workspaceId string
   * @param channelId string
   *
   */
  removeChannel(
    companyId: string,
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelsMineDeleteBaseResponse> {
    return Api.delete<ChannelsMineDeleteBaseResponse>(
      `${this.prefix}/${companyId}/workspaces/${workspaceId}/channels/${channelId}`,
    );
  }
}

export default new ChannelsMineAPIClient();
