import { PendingEmail } from 'app/features/pending-emails/types/pending-email';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';
import UserServices from 'app/features/users/services/current-user-service';
import DepreciatedCollections from 'app/deprecated/CollectionsV1/Collections/Collections';
import { GenericMember } from '../types/guest-types';

class GuestManagementService {
  guests: GenericMember[] = [];
  pendingEmails: GenericMember[] = [];
  list: GenericMember[] = [];

  bind({
    search,
    pendingEmails,
    channelMembers,
  }: {
    search: string;
    pendingEmails: PendingEmail[];
    channelMembers: ChannelMemberType[];
  }): void {
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

  setGuests(members: ChannelMemberType[]): GenericMember[] {
    return (this.guests = members.map((member: ChannelMemberType) => {
      return {
        type: 'guest',
        filterString: UserServices.getFullName(
          DepreciatedCollections.get('users').find(member.user_id || ''),
        ),
        resource: member,
        key: member.user_id || '',
      };
    }));
  }

  setPendingEmails(pendingEmails: PendingEmail[]): GenericMember[] {
    const result: GenericMember[] = pendingEmails.map((pendingEmail: PendingEmail) => ({
      key: pendingEmail.email,
      type: 'pending-email',
      filterString: pendingEmail.email,
      resource: pendingEmail,
    }));

    return (this.pendingEmails = result.sort((a, b) =>
      (a.filterString || '').localeCompare(b.filterString || ''),
    ));
  }

  setList(pendingEmails: PendingEmail[], members: ChannelMemberType[]): GenericMember[] {
    this.setGuests(members);
    this.setPendingEmails(pendingEmails);
    return (this.list = [...this.pendingEmails, ...this.guests]);
  }

  destroyList(): void {
    this.list = [];
  }
}

export default new GuestManagementService();
