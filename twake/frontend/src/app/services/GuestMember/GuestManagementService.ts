import { PendingEmail, PendingEmailResource } from 'app/models/PendingEmail';
import { ChannelMemberResource } from 'app/models/Channel';
import Collections, { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'services/RouterService';
import UserServices from 'services/user/UserService';
import ConsoleService from '../Console/ConsoleService';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';
import { GenericMember } from './types';

class GuestManagementService {
  guests: GenericMember[] = [];
  pendingEmails: GenericMember[] = [];
  list: GenericMember[] = [];

  bind({ search, channel_id }: { search: string; channel_id: string }): void {
    const { workspaceId, companyId } = RouterServices.getStateFromRoute();
    const channelMembersCollection = this.getChannelMembersCollection(
      companyId,
      workspaceId,
      channel_id,
    );
    const channelMembers = channelMembersCollection.find({}, { query: { company_role: 'guest' } });
    const pendingEmailsCollection = this.getPendingEmailCollection(
      companyId,
      workspaceId,
      channel_id,
    );
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
    }

    return this.list;
  }

  setGuests(members: ChannelMemberResource[]): GenericMember[] {
    return (this.guests = members.map((member: ChannelMemberResource) => {
      return {
        type: 'guest',
        filterString: UserServices.getFullName(
          DepreciatedCollections.get('users').find(member.data.user_id || ''),
        ),
        resource: member,
        key: member.data.id || '',
      };
    }));
  }

  setPendingEmails(pendingEmails: PendingEmailResource[]): GenericMember[] {
    const result: GenericMember[] = pendingEmails.map((pendingEmail: PendingEmailResource) => ({
      key: pendingEmail.key,
      type: 'pending-email',
      filterString: pendingEmail.data.email,
      resource: pendingEmail,
    }));

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
    const pendingEmailCollection = this.getPendingEmailCollection(
      company_id,
      workspace_id,
      channel_id,
    );
    const resourceToAdd = new PendingEmailResource({ company_id, workspace_id, channel_id, email });

    ConsoleService.addMailsInWorkspace({
      company_id,
      workspace_id,
      emails: [email],
      companyRole: 'guest',
    });

    return pendingEmailCollection.upsert(resourceToAdd);
  }

  deletePendingEmail(data: PendingEmail): Promise<void> {
    return this.getPendingEmailCollection(
      data.company_id,
      data.workspace_id,
      data.channel_id,
    ).remove(data);
  }

  destroyList(): void {
    this.list = [];
  }

  private getPendingEmailCollection(
    companyId: string = '',
    workspaceId: string = '',
    channelId: string = '',
  ): Collection<PendingEmailResource> {
    return Collections.get(
      this.getPendingEmailsRoute(companyId, workspaceId, channelId),
      PendingEmailResource,
    );
  }

  private getChannelMembersCollection(
    companyId: string = '',
    workspaceId: string = '',
    channelId: string = '',
  ): Collection<ChannelMemberResource> {
    return Collections.get(
      this.getGuestMembersRoute(companyId, workspaceId, channelId),
      ChannelMemberResource,
    );
  }

  private getPendingEmailsRoute(
    companyId: string = '',
    workspaceId: string = '',
    channelId: string = '',
  ): string {
    return `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/pending_emails/`;
  }

  private getGuestMembersRoute(
    companyId: string = '',
    workspaceId: string = '',
    channelId: string = '',
  ): string {
    return `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/members/::guests`;
  }
}

export default new GuestManagementService();
