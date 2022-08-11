import { ChannelMemberType } from 'app/features/channel-members-search/types/channel-members';
import Api from 'app/features/global/framework/api-service';
import { TwakeService } from 'app/features/global/framework/registry-decorator-service';
import { WebsocketRoom } from 'app/features/global/types/websocket-types';
import {
  ParamsChannelMember,
  PayloadChannelMemberType,
  ResponseChannelMemberType,
  ResponseChannelMemberTypeList,
} from '../types/channel-members';

@TwakeService('ChannelMemberAPIClientService')
class ChannelMembersApiClient {
  private readonly apiBaseUrl: string = '/internal/services/channels/v1/companies';
  private _realtime: WebsocketRoom = { room: '', token: '' };
  public get realtime(): WebsocketRoom {
    return this._realtime;
  }
  public set realtime(value: WebsocketRoom) {
    this._realtime = value;
  }

  //GET http://localhost:8000/internal/services/channels/v1/companies/bed8e8c0-e702-11ec-8b1c-853839b98938/workspaces/bef76d40-e702-11ec-8b1c-853839b98938/channels/57578c6a-99ce-4a32-842f-4005c81c5e7d/members?websockets=1
  async getMembers(params: ParamsChannelMember, search?: string) {
    console.log('getMembers ....', params);
    return Api.get<ResponseChannelMemberTypeList>(
      `${this.apiBaseUrl}/${params.companyId}/workspaces/${params.workspaceId}/channels/${
        params.channelId
      }/members?websockets=1${search ? `&search=${search}` : ''}`,
    ).then(({ websockets, resources }) => {
      if (websockets) this.realtime = websockets[0];
      return resources;
    });
  }

  //post  /channels/v1/companies/{company_id}/workspaces/{workspace_id | "direct"}/channels/{channel_id}/members/{user_id | void}
  async addMember(member: Partial<ChannelMemberType>, params: ParamsChannelMember) {
    return Api.post<PayloadChannelMemberType, ResponseChannelMemberType>(
      `${this.apiBaseUrl}/${params.companyId}/workspaces/${params.workspaceId}/channels/${params.channelId}/members`,
      { resource: member },
    ).then(({ resource }) => resource);
  }

  async deleteMember(memberId: string, params: ParamsChannelMember) {
    return Api.delete<ResponseChannelMemberType>(
      `${this.apiBaseUrl}/${params.companyId}/workspaces/${params.workspaceId}/channels/${params.channelId}/members/${memberId}`,
    ).then(({ resource }) => {
      return resource;
    });
  }
}

export default new ChannelMembersApiClient();
