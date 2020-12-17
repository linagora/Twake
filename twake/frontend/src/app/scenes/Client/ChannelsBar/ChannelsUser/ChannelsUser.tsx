import React, { useState } from 'react';

import Languages from 'services/languages/languages.js';
import RouterServices from 'app/services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import { ChannelResource } from 'app/models/Channel';

import MediumPopupComponent from 'app/components/Modal/ModalManager';
import NewDirectMessagesPopup from 'app/scenes/Client/ChannelsBar/Modals/NewDirectMessagesPopup';
import ChannelCategory from 'app/scenes/Client/ChannelsBar/Parts/Channel/ChannelCategory';
import { Button } from 'antd';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';

export function ChannelsUser() {
  const { companyId } = RouterServices.useStateFromRoute();
  const url: string = `/channels/v1/companies/${companyId}/workspaces/direct/channels/::mine`;
  const channelsCollection = Collection.get(url, ChannelResource, { tag: 'mine' });

  const [limit, setLimit] = useState(100);

  const directChannels = channelsCollection.useWatcher(
    {},
    { limit: limit, observedFields: ['id', 'user_member.favorite'] },
  );

  const openConv = () => {
    return MediumPopupComponent.open(<NewDirectMessagesPopup />, {
      position: 'center',
      size: { width: '400px' },
    });
  };

  return (
    <div className="users_channels">
      <ChannelCategory
        refAdd={(node: any) => {
          node = node;
        }}
        text={Languages.t(
          'scenes.app.channelsbar.channelsuser.private_messages',
          'Direct messages',
        )}
        onAdd={() => openConv()}
      />
      {directChannels
        .filter(channel => !channel.data.user_member?.favorite)
        .map(channel => {
          return (
            <ChannelIntermediate
              key={channel.id}
              collection={channelsCollection}
              channel={channel.data}
            />
          );
        })}

      {directChannels.length == 0 && (
        <div className="channel_small_text">
          {Languages.t(
            'scenes.app.channelsbar.channelsuser.no_private_message_invite_collaboraters',
          )}
        </div>
      )}
      {directChannels.length == limit && (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <Button
            type="link"
            onClick={() => {
              setLimit(directChannels.length + 20);
            }}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
