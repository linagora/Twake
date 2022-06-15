import React, { useEffect } from 'react';
import RecentChannelsAndContacts from 'components/search-popup/parts/recent/channels-and-contacts';
import Search from 'features/global/services/search-service';
import ChannelsAndContacts from 'components/search-popup/parts/channels-and-contacts';
import { UserType } from 'features/users/types/user';

export default (): JSX.Element => {
  useEffect(() => {}, []);

  if (!Search.recent.channels) {
    return <div />;
  }

  const directChannels = Search.recent.channels.filter(a => a.visibility === 'direct');
  const publicChannels = Search.recent.channels.filter(a => a.visibility === 'public');

  const users = [] as UserType[];
  const usedIds = new Set();

  directChannels.forEach(ch => {
    ch.users?.forEach(u => {
      if (!usedIds.has(u.id)) {
        users.push(u);
        usedIds.add(u.id);
      }
    });
  });

  return (
    <div className="search-results tab-chats">
      <RecentChannelsAndContacts />

      <ChannelsAndContacts channels={publicChannels} users={users} />
    </div>
  );
};
