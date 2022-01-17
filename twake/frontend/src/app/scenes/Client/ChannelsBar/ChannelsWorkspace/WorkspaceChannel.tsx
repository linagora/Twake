import React from 'react';

import { ChannelResource, ChannelType } from 'app/models/Channel';

import Languages from 'services/languages/languages';
import ModalManager from 'app/components/Modal/ModalManager';
import { Collection } from 'services/CollectionsReact/Collections';

import ChannelCategory from '../Parts/Channel/ChannelCategory';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';

import ChannelWorkspaceEditor from 'scenes/Client/ChannelsBar/Modals/ChannelWorkspaceEditor';
import WorkspaceChannelList from 'scenes/Client/ChannelsBar/Modals/WorkspaceChannelList';

import Menu from 'components/Menus/Menu.js';
import Icon from 'components/Icon/Icon';
import AccessRightsService from 'app/services/AccessRightsService';
import RouterServices from 'services/RouterService';

type Props = {
  collection: Collection<ChannelResource>;
  directCollection: Collection<ChannelResource>;
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
      size: { width: '500px' },
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
              className="add"
              menu={[
                {
                  type: 'menu',
                  text: Languages.t('components.leftbar.channel.workspaceschannels.menu.option_1'),
                  onClick: () => addChannel(),
                },
                {
                  type: 'menu',
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
          return (
            <ChannelIntermediate
              key={key}
              collection={
                data.workspace_id === 'direct' ? props.directCollection : props.collection
              }
              channel={data || ''}
            />
          );
        })}
    </>
  );
};
