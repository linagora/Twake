import React, { useEffect, useState } from 'react';

import Languages from 'app/features/global/services/languages-service';
import RouterServices from 'app/features/router/services/router-service';

import MediumPopupComponent from 'app/components/modal/modal-manager';
import NewDirectMessagesPopup from 'app/views/client/channels-bar/Modals/new-direct-channel-popup';
import ChannelCategory from 'app/views/client/channels-bar/Parts/Channel/ChannelCategory';
import { Button } from 'antd';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';
import ChannelsBarService from 'app/features/channels/services/channels-bar-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';

export default () => {
  const { companyId } = RouterServices.getStateFromRoute();
  let { directChannels } = useDirectChannels();
  let [max, setMax] = useState(20);

  const openConv = () => {
    return MediumPopupComponent.open(<NewDirectMessagesPopup />, {
      position: 'center',
      size: { width: '400px' },
    });
  };

  const [delayed, setDelayed] = useState(true);

  //This delay make the app faster: could be removed with an implementation of virtualized list
  useEffect(() => {
    setTimeout(() => setDelayed(false), 50);
  }, []);

  if (delayed) {
    return <></>;
  }

  const nonfavoriteDirectChannels = directChannels.filter(
    channel => !channel.user_member?.favorite,
  );

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
      {nonfavoriteDirectChannels
        .sort(
          (a, b) =>
            (parseInt(b.last_activity?.toString() || '') || 0) -
            (parseInt(a.last_activity?.toString() || '') || 0),
        )
        .slice(0, max)
        .map(channel => {
          return <ChannelIntermediate key={channel.id} channel={channel} />;
        })}

      {max < nonfavoriteDirectChannels.length && (
        <div style={{ textAlign: 'center' }}>
          <a href="#" onClick={() => setMax(max + 20)}>
            Load more...
          </a>
        </div>
      )}

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
