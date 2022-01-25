import { ChannelType } from 'app/features/channels/types/channel';
import { UserType } from 'app/features/users/types/user';
import Strings from 'app/services/utils/strings';
import UsersService from 'app/features/users/services/current-user-service';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import { Collection } from 'app/deprecated/CollectionsReact/Collections';
import RouterServices from 'app/features/router/services/router-service';
import { getUserParts } from 'app/components/member/user-parts';
import Observable from 'services/Observable/Observable';
import UserAPIClient from '../../features/users/api/user-api-client';
import ChannelsReachableAPIClient from '../../features/channels/api/channels-reachable-api-client';
import ChannelsMineAPIClient from '../../features/channels/api/channels-mine-api-client';

export type GenericChannel = {
  type: 'user' | 'direct' | 'workspace';
  sortString: string;
  filterString: string;
  lastActivity?: number;
  resource: UserType | ChannelType;
};

class SearchListManager extends Observable {
  private workspaceChannels: GenericChannel[];
  private directChannels: GenericChannel[];
  private users: GenericChannel[];
  public list: GenericChannel[];

  constructor() {
    super();
    this.workspaceChannels = [];
    this.directChannels = [];
    this.users = [];
    this.list = [];
  }

  public async searchAll(
    search: string,
    opt?: {
      onlyChannel: boolean;
    },
  ): Promise<void> {
    const { workspaceId, companyId } = RouterServices.getStateFromRoute();

    // Reachable
    let channels: ChannelType[] = [];

    // Direct Channels
    let directChannels: ChannelType[] = [];

    // Mine
    let mineWorkspaceChannels: ChannelType[] = [];

    let usersSearched: UserType[] = [];

    if (companyId && workspaceId) {
      channels = await ChannelsReachableAPIClient.get(companyId, workspaceId);
      directChannels = await ChannelsMineAPIClient.get({ companyId }, { direct: true });
      mineWorkspaceChannels = await ChannelsMineAPIClient.get({ companyId, workspaceId });
      usersSearched = await this.searchUsers(search);
    }

    // Filters
    this.workspaceChannels = this.filterWorkspaceChannels({
      channels,
      mineWorkspaceChannels,
    });

    this.directChannels = opt?.onlyChannel
      ? []
      : this.filterDirectChannels({ channels: directChannels });
    this.users = this.filterUsers({ users: usersSearched });
    // Concat list
    this.list = [...this.workspaceChannels, ...this.directChannels, ...this.users];

    this.removeDuplicate();

    this.list = this.list
      .filter(({ filterString }) => {
        return filterString.toUpperCase().indexOf(search.toUpperCase()) > -1;
      })
      .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    this.notify();
  }

  private async searchUsers(text: string) {
    return UserAPIClient.search<UserType>(Strings.removeAccents(text), {
      scope: 'company',
      companyId: Workspaces.currentGroupId,
    });
  }

  private filterWorkspaceChannels({
    channels,
    mineWorkspaceChannels,
  }: {
    channels: ChannelType[];
    mineWorkspaceChannels: ChannelType[];
  }) {
    const workspaceChannels: GenericChannel[] = channels.map(channel => {
      return {
        sortString: channel.name || '',
        filterString: channel.name || '',
        type: 'workspace',
        lastActivity: channel.last_activity || 0,
        resource: channel,
      };
    });

    return workspaceChannels.filter(channel => {
      if (channel.type === 'workspace') {
        const resource = channel.resource as ChannelType;
        const isNotAbleToSeeChannel =
          !this.isChannelMember(mineWorkspaceChannels, resource) &&
          resource.visibility === 'private';
        return !isNotAbleToSeeChannel;
      }
      return undefined;
    });
  }

  private filterDirectChannels({ channels }: { channels: ChannelType[] }) {
    const directChannels: GenericChannel[] = channels.map((channel: ChannelType) => {
      const { name } = getUserParts({
        usersIds: channel.members || [],
      });

      return {
        sortString: name,
        filterString: name,
        type: 'direct',
        lastActivity: channel.last_activity || 0,
        resource: channel,
      };
    });

    return directChannels;
  }

  private filterUsers({ users }: { users: UserType[] }) {
    const usersSearched: GenericChannel[] = users.map(user => {
      const { name } = getUserParts({
        usersIds: [user.id || ''],
      });

      return (
        user && {
          sortString: name,
          filterString: UsersService.getFullName(user),
          type: 'user',
          resource: user,
        }
      );
    });

    return usersSearched;
  }

  /**
   * Remove duplicates between direct channels and users
   */
  private removeDuplicate() {
    let existingUsersIdAsDirectChannels = this.list
      .filter(
        userOrChannel =>
          userOrChannel.type === 'direct' &&
          ((userOrChannel.resource as ChannelType).members?.length || 0) <= 2,
      )
      .map(userOrChannel => {
        const channel = userOrChannel.resource as ChannelType;
        if (channel.members?.length === 1) {
          return channel.members[0];
        }
        if (channel.members?.length === 2) {
          const otherUserId = channel.members.filter(
            id => id !== UsersService.getCurrentUserId(),
          )[0];
          return otherUserId;
        }
        return undefined;
      });

    this.list = this.list.filter(userOrChannel => {
      if (userOrChannel.type === 'user') {
        const user = userOrChannel.resource as UserType;
        return !existingUsersIdAsDirectChannels.includes(user.id);
      }
      return true;
    });
  }

  private isChannelMember(mine: ChannelType[], resource: ChannelType) {
    return mine.some(channel => resource.id === channel.id && channel.user_member?.user_id);
  }
}

const SearchListManagerService = new SearchListManager();

export default SearchListManagerService;
