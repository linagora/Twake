import React, { useState } from 'react';

import Languages from 'services/languages/languages.js';
import RouterServices from 'app/services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import { ChannelResource } from 'app/models/Channel';
import DirectChannel from 'app/components/Leftbar/Channel/directChannel';

import MediumPopupComponent from 'app/services/Modal/ModalManager';
import NewDirectMessagesPopup from 'app/scenes/Client/ChannelsBar/NewDirectMessagesPopup';
import ChannelCategory from 'components/Leftbar/Channel/ChannelCategory.js';
import { Button } from 'antd';

export function ChannelsUser() {
  const { companyId } = RouterServices.useStateFromRoute();
  const url: string = `/channels/v1/companies/${companyId}/workspaces/direct/channels/`;
  const channelsCollection = Collection.get(url, ChannelResource, { tag: 'mine' });

  const [limit, setLimit] = useState(100);

  const directChannels = channelsCollection.useWatcher({}, { limit: limit, query: { mine: true } });

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
      {directChannels.map(channel => {
        return (
          <DirectChannel key={channel.id} collection={channelsCollection} channel={channel.data} />
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
