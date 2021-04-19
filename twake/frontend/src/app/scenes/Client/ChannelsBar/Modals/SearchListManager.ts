import { ChannelResource } from 'app/models/Channel';
import { UserType } from 'app/models/User';
import Strings from 'app/services/utils/strings';
import UsersService from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';
import { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'services/RouterService';
import { getUserParts } from 'app/components/Member/UserParts';

export type GenericChannel = {
  type: 'user' | 'direct' | 'workspace';
  sortString: string;
  filterString: string;
  lastActivity?: number;
  resource: UserType | ChannelResource;
};

class SearchListManager {
  private workspaceChannels: GenericChannel[];
  private directChannels: GenericChannel[];
  private users: GenericChannel[];
  public list: GenericChannel[];

  constructor() {
    this.workspaceChannels = [];
    this.directChannels = [];
    this.users = [];
    this.list = [];
  }

  public async bind(search: string): Promise<void> {
    const { workspaceId, companyId } = RouterServices.getStateFromRoute();
    // Path
    const workspaceChannelsPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
    const directChannelsPath = `/channels/v1/companies/${companyId}/workspaces/direct/channels/::mine`;
    const mineWorkspaceChannelsPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;

    // Resources
    const workspaceChannelsResources = (await this.find({
      collectionPath: workspaceChannelsPath,
    })) as ChannelResource[];

    const directChannelsResources = (await this.find({
      collectionPath: directChannelsPath,
    })) as ChannelResource[];

    const mineWorkspaceChannelsResources = (await this.find({
      collectionPath: mineWorkspaceChannelsPath,
    })) as ChannelResource[];

    const usersSearched = (await this.find({ search })) as UserType[];

    // Filters
    this.workspaceChannels = this.filterWorkspaceChannels({
      channels: workspaceChannelsResources,
      mineWorkspaceChannels: mineWorkspaceChannelsResources,
    });
    this.directChannels = this.filterDirectChannels({ channels: directChannelsResources });
    this.users = this.filterUsers({ users: usersSearched });

    // Concat list
    this.list = [...this.workspaceChannels, ...this.directChannels, ...this.users];

    this.removeDuplicate();

    this.list = this.list
      .filter(({ filterString }) => filterString.toUpperCase().indexOf(search.toUpperCase()) > -1)
      .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
  }

  private async find({
    collectionPath,
    search,
  }: {
    collectionPath?: string;
    search?: string;
  }): Promise<(UserType | ChannelResource)[]> {
    if (collectionPath?.length) {
      return Collection.get(collectionPath, ChannelResource).find({});
    } else {
      let users: UserType[] = [];

      users.push(...(await this.searchUsers(search || '')));

      return users;
    }
  }

  private async searchUsers(text: string) {
    const result = new Promise<UserType[]>((resolve, reject) => {
      if (text) {
        const users: UserType[] = [];

        UsersService.search(
          Strings.removeAccents(text),
          {
            scope: 'group',
            group_id: Workspaces.currentGroupId,
          },
          (res: UserType[]) => users.push(...res.filter((el: UserType) => !!el)),
        );

        return resolve(users);
      }
    });

    return result;
  }

  private filterWorkspaceChannels({
    channels,
    mineWorkspaceChannels,
  }: {
    channels: ChannelResource[];
    mineWorkspaceChannels: ChannelResource[];
  }) {
    const workspaceChannels: GenericChannel[] = channels.map((channel: ChannelResource) => {
      return {
        sortString: channel.data.name || '',
        filterString: channel.data.name || '',
        type: 'workspace',
        lastActivity: channel.data.last_activity || 0,
        resource: channel,
      };
    });

    return workspaceChannels.filter(channel => {
      if (channel.type === 'workspace') {
        const resource = channel.resource as ChannelResource;
        const isNotAbleToSeeChannel =
          this.isChannelMember(mineWorkspaceChannels, resource) === false &&
          resource.data.visibility === 'private';
        return !isNotAbleToSeeChannel;
      }
    });
  }

  private filterDirectChannels({ channels }: { channels: ChannelResource[] }) {
    const directChannels: GenericChannel[] = channels.map((channel: ChannelResource) => {
      const { name } = getUserParts({
        usersIds: channel.data.members || [],
      });

      return {
        sortString: name,
        filterString: name,
        type: 'direct',
        lastActivity: channel.data.last_activity || 0,
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
          ((userOrChannel.resource as ChannelResource).data.members?.length || 0) <= 2,
      )
      .map(userOrChannel => {
        const channel = userOrChannel.resource as ChannelResource;
        if (channel.data.members?.length === 1) {
          return channel.data.members[0];
        }
        if (channel.data.members?.length === 2) {
          const otherUserId = channel.data.members.filter(
            id => id !== UsersService.getCurrentUserId(),
          )[0];
          return otherUserId;
        }
      });

    this.list = this.list.filter(userOrChannel => {
      if (userOrChannel.type === 'user') {
        const user = userOrChannel.resource as UserType;
        return !existingUsersIdAsDirectChannels.includes(user.id);
      }
      return true;
    });
  }

  private isChannelMember(mine: ChannelResource[], resource: ChannelResource) {
    return mine.some(channel => resource.id === channel.id && channel.data.user_member?.user_id);
  }
}

const SearchListManagerService = new SearchListManager();

export default SearchListManagerService;
