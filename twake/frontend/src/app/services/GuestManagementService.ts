import { PendingEmail, PendingEmailResource } from 'app/models/PendingEmail';
import Collections, { Collection } from 'services/CollectionsReact/Collections';
import { ChannelMemberResource } from 'app/models/Channel';
import RouterServices from 'services/RouterService';
import UserServices from 'services/user/user.js';
import { UserType } from 'app/models/User';
import ConsoleService from './ConsoleService';

export type GenericMember = {
  key: string;
  type: 'pending-email' | 'guest';
  filterString: string;
  resource: PendingEmailResource | ChannelMemberResource;
};

class GuestManagementService {
  guests: GenericMember[] = [];
  pendingEmails: GenericMember[] = [];
  list: GenericMember[] = [];

  bind({ search, channel_id }: { search: string; channel_id: string }): void {
    const { workspaceId, companyId } = RouterServices.getStateFromRoute();
    const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel_id}/members/`;
    const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);
    const channelMembers = channelMembersCollection.find({});

    const route = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel_id}/pending_emails/`;
    const pendingEmailsCollection = Collections.get(route, PendingEmailResource);
    const pendingEmails = pendingEmailsCollection.find({});

    this.setList(pendingEmails, channelMembers);

    this.list = this.filterSearch(search);
  }

  filterSearch(search: string): GenericMember[] {
    if (search.length) {
      return this.list.filter(
        ({ filterString }) =>
          (filterString || '').toUpperCase().indexOf((search || '').toUpperCase()) > -1,
      );
    } else return this.list;
  }

  setGuests(members: ChannelMemberResource[]): GenericMember[] {
    return (this.guests = members
      .filter(member => member.type === 'guest')
      .map((member: ChannelMemberResource) => {
        const user = this.getUser(member);
        // opt 1
        // list des membres du channel( )
        // recupérer user avec le user_id
        // liste des users du workspace

        // opt 2
        //
        return {
          type: 'guest',
          filterString: UserServices.getFullName(user),
          resource: member,
          key: member.data.id || '',
        };
      }));
  }

  private getUser(member: ChannelMemberResource): Promise<UserType> {
    const result = new Promise<UserType>((resolve, reject) => {
      UserServices.asyncGet(member.data.user_id, (user: UserType) => {
        if (user) return resolve(user);
        else return reject('error while trying to get User in GuestManagementService');
      });
    });

    return result;
  }

  setPendingEmails(pendingEmails: PendingEmailResource[]): GenericMember[] {
    const result: GenericMember[] = pendingEmails.map((pendingEmail: PendingEmailResource) => {
      return {
        key: pendingEmail.key,
        type: 'pending-email',
        filterString: pendingEmail.data.email,
        resource: pendingEmail,
      };
    });

    return (this.pendingEmails = result.sort((a, b) =>
      (a.filterString || '').localeCompare(b.filterString || ''),
    ));
  }

  setList(
    pendingEmails: PendingEmailResource[],
    members: ChannelMemberResource[],
  ): GenericMember[] {
    this.setGuests(members);
    this.setPendingEmails(pendingEmails);
    return (this.list = [...this.pendingEmails, ...this.guests]);
  }

  upsertPendingEmail({
    company_id,
    workspace_id,
    channel_id,
    email,
  }: PendingEmail): Promise<PendingEmailResource> {
    const pendingEmailRoute = `/channels/v1/companies/${company_id}/workspaces/${workspace_id}/channels/${channel_id}/pending_emails/`;
    const pendingEmailCollection = Collections.get(pendingEmailRoute, PendingEmailResource);
    const resourceToAdd = new PendingEmailResource({ company_id, workspace_id, channel_id, email });

    ConsoleService.addMailsInWorkspace({
      company_id,
      workspace_id,
      emails: [email],
      role: 'guest',
    });

    return pendingEmailCollection.upsert(resourceToAdd);
  }

  deletePendingEmail(data: PendingEmail): Promise<void> {
    const pendingEmailRoute = `/channels/v1/companies/${data.company_id}/workspaces/${data.workspace_id}/channels/${data.channel_id}/pending_emails/`;
    const pendingEmailCollection = Collections.get(pendingEmailRoute, PendingEmailResource);
    return pendingEmailCollection.remove(data);
  }

  destroyList(): void {
    this.list = [];
  }
}

export default new GuestManagementService();
