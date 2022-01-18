import { Divider } from 'antd';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import { UserType } from 'app/models/User';
import { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'services/RouterService';
import React from 'react';
import DirectChannelRow from './DirectChannelRow';
import WorkspaceChannelRow from './WorkspaceChannelRow';
import { GenericChannel } from 'services/search/searchListManager';
import { usePublicOrPrivateChannels } from 'app/state/recoil/hooks/channels/usePublicOrPrivateChannels';

type PropsType = {
  list: GenericChannel[];
  active: number;
  limit: number;
  setCursor: any;
};

const SearchListContainer = ({ list, active, limit, setCursor }: PropsType) => {
  const { privateChannels, publicChannels } = usePublicOrPrivateChannels();
  const mine = [...privateChannels, ...publicChannels];

  const isJoined = (resource: ChannelType) => {
    return mine.some(channel => resource.id === channel.id && channel.user_member?.user_id);
  };

  return (
    <>
      {list.slice(0, limit).map((item, index) => (
        <div
          key={`${item?.resource?.id}`}
          className={index === active ? 'active' : ''}
          onMouseEnter={() => setCursor(-1)}
        >
          {item.type === 'user' && (
            <DirectChannelRow
              userIds={[(item.resource as UserType).id || '']}
              type={item.type}
              active={index === active}
            />
          )}
          {item.type === 'workspace' && (
            <WorkspaceChannelRow
              channel={item.resource as ChannelType}
              joined={isJoined(item.resource as ChannelType)}
              active={index === active}
            />
          )}
          {item.type === 'direct' && (
            <DirectChannelRow
              userIds={(item.resource as ChannelType).members || []}
              type={item.type}
              active={index === active}
            />
          )}
        </div>
      ))}
    </>
  );
};

export default SearchListContainer;
