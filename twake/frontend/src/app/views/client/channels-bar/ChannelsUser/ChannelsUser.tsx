import React, { useState } from 'react';

import Languages from 'app/features/global/services/languages-service';
import RouterServices from 'app/features/router/services/router-service';
import { Collection } from 'app/deprecated/CollectionsReact/Collections';
import { ChannelType } from 'app/features/channels/types/channel';

import MediumPopupComponent from 'app/components/modal/modal-manager';
import NewDirectMessagesPopup from 'app/views/client/channels-bar/Modals/NewDirectMessagesPopup';
import ChannelCategory from 'app/views/client/channels-bar/Parts/Channel/ChannelCategory';
import { Button } from 'antd';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';
import ChannelsBarService from 'app/features/channels/services/channels-bar-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';

export default () => {
  const { companyId } = RouterServices.getStateFromRoute();
  let { directChannels } = useDirectChannels();

  console.log(directChannels);

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
          // eslint-disable-next-line no-self-assign
          node = node;
        }}
        text={Languages.t(
          'scenes.app.channelsbar.channelsuser.private_messages',
          [],
          'Direct messages',
        )}
        onAdd={AccessRightsService.hasCompanyLevel(companyId, 'member') ? () => openConv() : null}
      />
      {directChannels
        .filter(channel => !channel.user_member?.favorite)
        .sort(
          (a, b) =>
            (parseInt(b.last_activity?.toString() || '') || 0) -
            (parseInt(a.last_activity?.toString() || '') || 0),
        )
        .map(channel => {
          return <ChannelIntermediate key={channel.id} channel={channel} />;
        })}

      {directChannels.length === 0 && (
        <div className="channel_small_text">
          {Languages.t(
            'scenes.app.channelsbar.channelsuser.no_private_message_invite_collaboraters',
          )}
        </div>
      )}
    </div>
  );
};
