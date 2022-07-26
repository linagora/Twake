import Strings from 'app/features/global/utils/strings';
import { useSearchUsers } from 'app/features/users/hooks/use-search-user-list';
import { UserType } from 'app/features/users/types/user';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { SearchChannelMemberInputState } from '../state/search-channel-member';
import { ChannelMemberWithUser, ParamsChannelMember } from '../types/channel-members';
import { useChannelMembers } from './members-hook';
import { useSearchChannelMembers } from './search-channel-member';
import { useSearchChannelPendingEmail } from './search-pending-email';
import { useChannelPendingEmails } from './use-pending-emails';

export const useSearchChannelMembersAll = (params: ParamsChannelMember) => {
  const { channelMembers } = useChannelMembers(params);
  const { listChannelMembers } = useSearchChannelMembers(params?.channelId || '');

  const [searchState, setSearchState] = useRecoilState(SearchChannelMemberInputState);

  const { pendingEmails } = useChannelPendingEmails(params);
  const { filteredPendingEmails } = useSearchChannelPendingEmail(params);

  const { result: usersList, search: searchUsers } = useSearchUsers({ scope: 'company' });

  const pendingEmailList = searchState ? filteredPendingEmails : pendingEmails;
  const channelMembersList = searchState ? listChannelMembers : channelMembers;

  const [addEmailSuggestion, setEmailSuggestion] = useState<boolean>(false);
  useEffect(() => {
    if (!pendingEmailList.length && !!searchState.length) {
      setEmailSuggestion(true);
    }
    searchUsers(searchState);
  }, [searchState]);

  return {
    addEmailSuggestion,
    usersList: _.differenceBy(
      usersList,
      channelMembersList || [],
      item => (item as ChannelMemberWithUser).user_id || (item as UserType).id,
    ),
    pendingEmailList,
    channelMembersList,
    search: setSearchState,
    query: searchState,
  };
};
