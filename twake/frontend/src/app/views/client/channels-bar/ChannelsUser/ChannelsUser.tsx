import React, { useEffect, useState } from 'react';

import Languages from 'app/features/global/services/languages-service';
import RouterServices from 'app/features/router/services/router-service';

import NewDirectMessagesPopup from 'app/views/client/channels-bar/Modals/new-direct-channel-popup';
import ChannelCategory from 'app/views/client/channels-bar/Parts/Channel/ChannelCategory';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';
import { Modal } from 'app/atoms/modal';
import { PencilAltIcon } from '@heroicons/react/outline';

export default () => {
  const { companyId } = RouterServices.getStateFromRoute();
  const { directChannels } = useDirectChannels();
  const [max, setMax] = useState(20);
  const [openDirect, setOpenDirect] = useState(false);

  const openConv = () => {
    console.log(openDirect);
    setOpenDirect(true);
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
      <Modal open={openDirect} onClose={() => setOpenDirect(false)}>
        <NewDirectMessagesPopup onClose={() => setOpenDirect(false)} />
      </Modal>

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
        addIcon={<PencilAltIcon className="h-5 w-5" />}
        onAdd={() => (AccessRightsService.hasCompanyLevel(companyId, 'member') ? openConv() : null)}
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
