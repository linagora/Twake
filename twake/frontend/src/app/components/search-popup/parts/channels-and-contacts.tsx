import Search from 'features/global/services/search-service';
import ChannelsResult from 'components/search-popup/parts/channels-result';
import UsersResult from 'components/search-popup/parts/users-result';
import React from 'react';
import { ChannelType } from 'app/features/channels/types/channel';
import { UserType } from 'features/users/types/user';

type PropsType = {
  channels: ChannelType[];
  users: UserType[];
};

export default ({ channels, users }: PropsType): JSX.Element => {
  return (
    <div>
      <div className="results-group-title ">Channels and contacts</div>

      {(channels && channels.length && (
        <div className="result-items">
          {channels.map(channel => (
            <ChannelsResult
              channel={channel}
              key={channel.id}
              highlight={Search.value}
              onClick={() => Search.close()}
            />
          ))}
        </div>
      )) || <div />}

      {(users && users.length && (
        <div className="result-items">
          {users.map(user => (
            <UsersResult
              user={user}
              key={user.id}
              highlight={Search.value}
              onClick={() => Search.close()}
            />
          ))}
        </div>
      )) || <div />}
    </div>
  );
};
