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

  public bind(search: string): void {
    const { workspaceId, companyId } = RouterServices.getStateFromRoute();
    // Path
    const workspaceChannelsPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
    const directChannelsPath = `/channels/v1/companies/${companyId}/workspaces/direct/channels/::mine`;
    const mineWorkspaceChannelsPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;

    // Resources
    const workspaceChannelsResources = this.find({
      collectionPath: workspaceChannelsPath,
    }) as ChannelResource[];

    const directChannelsResources = this.find({
      collectionPath: directChannelsPath,
    }) as ChannelResource[];

    const mineWorkspaceChannelsResources = this.find({
      collectionPath: mineWorkspaceChannelsPath,
    }) as ChannelResource[];

    const usersSearched = this.find({ search }) as UserType[];

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

  private find({
    collectionPath,
    search,
  }: {
    collectionPath?: string;
    search?: string;
  }): (UserType | ChannelResource)[] {
    if (collectionPath?.length) {
      const collection = Collection.get(collectionPath, ChannelResource);
      return collection.find({});
    } else {
      let users: UserType[] = [];

      this.searchUsers(res => (users = res), search || '');

      return users;
    }
  }

  private async searchUsers(cb: (res: UserType[]) => UserType[], text: string) {
    if (text) {
      return UsersService.search(
        Strings.removeAccents(text),
        {
          group_id: Workspaces.currentGroupId,
        },
        (res: UserType[]) => cb(res.filter((el: UserType) => !!el)),
      );
    }
  }

  private filterWorkspaceChannels({
    channels,
    mineWorkspaceChannels,
  }: {
    channels: ChannelResource[];
    mineWorkspaceChannels: ChannelResource[];
  }) {
    const workspaceChannels: GenericChannel[] = [];

    channels.forEach((channel: ChannelResource) => {
      workspaceChannels.push({
        sortString: channel.data.name || '',
        filterString: channel.data.name || '',
        type: 'workspace',
        lastActivity: channel.data.last_activity || 0,
        resource: channel,
      });
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
    const directChannels: GenericChannel[] = [];

    channels.forEach((channel: ChannelResource) => {
      const { name } = getUserParts({
        usersIds: channel.data.members || [],
      });

      directChannels.push({
        sortString: name,
        filterString: name,
        type: 'direct',
        lastActivity: channel.data.last_activity || 0,
        resource: channel,
      });
    });

    return directChannels;
  }

  private filterUsers({ users }: { users: UserType[] }) {
    const usersSearched: GenericChannel[] = [];

    users.forEach(user => {
      const { name } = getUserParts({
        usersIds: [user.id || ''],
      });

      usersSearched.push({
        sortString: name,
        filterString: UsersService.getFullName(user),
        type: 'user',
        resource: user,
      });
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

export default class SearchListManagerService {
  static instance: SearchListManager;

  public static init(): SearchListManager {
    if (!this.instance) {
      this.instance = new SearchListManager();
    }

    return this.instance;
  }
}
