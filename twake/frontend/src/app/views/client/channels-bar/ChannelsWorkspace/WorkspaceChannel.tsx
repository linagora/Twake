import React from 'react';

import { ChannelType } from 'app/features/channels/types/channel';

import Languages from 'app/features/global/services/languages-service';
import ModalManager from 'app/components/modal/modal-manager';
import { Collection } from 'app/deprecated/CollectionsReact/Collections';

import ChannelCategory from '../Parts/Channel/ChannelCategory';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';

import ChannelWorkspaceEditor from 'app/views/client/channels-bar/Modals/ChannelWorkspaceEditor';
import WorkspaceChannelList from 'app/views/client/channels-bar/Modals/WorkspaceChannelList';

import Menu from 'components/menus/menu.js';
import Icon from 'app/components/icon/icon';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import RouterServices from 'app/features/router/services/router-service';

type Props = {
  sectionTitle: string;
  channels: ChannelType[];
  favorite?: boolean;
  subgroup?: boolean;
};

export default (props: Props) => {
  const { workspaceId, companyId } = RouterServices.getStateFromRoute();

  const addChannel = () => {
    return ModalManager.open(
      <ChannelWorkspaceEditor title={'scenes.app.channelsbar.channelsworkspace.create_channel'} />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  const joinChannel = () => {
    return ModalManager.open(<WorkspaceChannelList />, {
      position: 'center',
      size: { width: '600px' },
    });
  };

  return (
    <>
      <ChannelCategory
        text={props.sectionTitle}
        suffix={
          !props.favorite &&
          !props.subgroup &&
          AccessRightsService.hasLevel(workspaceId, 'member') &&
          AccessRightsService.getCompanyLevel(companyId) !== 'guest' && (
            <Menu
              className="add channel-menu"
              menu={[
                {
                  type: 'menu',
                  text: Languages.t('components.leftbar.channel.workspaceschannels.menu.option_1'),
                  // Don't remove this className, we need it for integration tests
                  className: 'add-channel',
                  onClick: () => addChannel(),
                },
                {
                  type: 'menu',
                  // Don't remove this className, we need it for integration tests
                  className: 'join-channel',
                  text: Languages.t('components.leftbar.channel.workspaceschannels.menu.option_2'),
                  onClick: () => joinChannel(),
                },
              ]}
            >
              <Icon type="plus" className="m-icon-small" />
            </Menu>
          )
        }
      />
      {props.channels.length === 0 && (
        <div className="channel_small_text">
          {Languages.t('scenes.app.channelsbar.channelsworkspace.no_channel')}
        </div>
      )}
      {props.channels.length > 0 &&
        props.channels.map((data, key) => {
          return <ChannelIntermediate key={key} channel={data || ''} />;
        })}
    </>
  );
};
