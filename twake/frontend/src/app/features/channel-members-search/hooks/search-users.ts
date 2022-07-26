import { useSearchUsers } from 'app/features/users/hooks/use-search-user-list';
import { useRecoilValue } from 'recoil';
import { SearchChannelMemberInputState } from '../state/search-channel-member';
import { useChannelPendingEmails } from './use-pending-emails';

export const useSearchFilteredUsers = () => {
  const searchInput = useRecoilValue(SearchChannelMemberInputState);
  const { result: filteredUsers } = useSearchUsers({ scope: 'company' });
  let filteredList = filteredUsers;

  if (searchInput) {
    filteredList = filteredUsers.filter(({ email }) => {
      return searchInput.split(' ').every(_ => {
        return email.includes(searchInput);
      });
    });
  }

  return {
    filteredPendingEmails: filteredList,
  };
};
