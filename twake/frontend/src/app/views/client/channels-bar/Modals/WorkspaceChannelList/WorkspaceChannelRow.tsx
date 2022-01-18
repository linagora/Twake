import React, { createRef, useEffect } from 'react';

import { Col, Row, Tag, Typography } from 'antd';
import { capitalize } from 'lodash';
import Languages from 'services/languages/languages';
import Icon from 'components/Icon/Icon';
import RouterServices from 'app/services/RouterService';
import { ChannelType } from 'app/models/Channel';
import Emojione from 'app/components/Emojione/Emojione';
import UsersService from 'services/user/UserService';
import ModalManager from 'app/components/Modal/ModalManager';
import ChannelsReachableAPIClient from 'app/services/channels/ChannelsReachableAPIClient';
import { useFavoriteChannels } from 'app/state/recoil/hooks/channels/useFavoriteChannels';
import ChannelMembersAPIClient from 'app/services/channels/ChannelMembersAPIClient';

import './ChannelRow.scss';

type PropsType = {
  channel: ChannelType;
  joined: boolean;
  active: boolean;
};

export default ({ channel, joined, active }: PropsType) => {
  const { refresh: refreshFavoriteChannels } = useFavoriteChannels();
  const userId: string = UsersService.getCurrentUserId();

  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    }
  });

  const joinChannel = async () => {
    if (channel.company_id && channel.workspace_id && channel.id) {
      const channelMembers = await ChannelMembersAPIClient.get(
        channel.company_id,
        channel.workspace_id,
        channel.id,
      );

      const alreadyMemberInChannel = channelMembers.map(m => m.user_id)?.includes(userId);

      if (!alreadyMemberInChannel) {
        await ChannelsReachableAPIClient.inviteUser(
          channel.company_id,
          channel.workspace_id,
          channel.id,
          userId,
        ).finally(refreshFavoriteChannels);
      }
    }

    ModalManager.closeAll();
    RouterServices.push(
      RouterServices.generateRouteFromState({
        companyId: channel.company_id,
        workspaceId: channel.workspace_id || '',
        channelId: channel.id,
      }),
    );
  };

  return (
    <Row
      key={channel.id}
      ref={ref}
      justify="space-between"
      align="middle"
      className={`channel-row ${active ? 'channel-row-selected' : ''}`}
      onClick={joinChannel}
    >
      <Col style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ lineHeight: 0 }}>
          <Emojione type={channel.icon || ''} />
        </div>
        <span className="small-x-margin">
          <Typography.Text strong style={{ color: active ? 'var(--white)' : '' }}>
            {capitalize(channel.name)}
          </Typography.Text>
        </span>
        {channel.visibility === 'private' && <Icon type="lock" />}
      </Col>

      {!joined && channel.visibility === 'public' && (
        <Col>
          <Tag color="transparent">
            <Typography.Text>
              {Languages.t(
                'scenes.client.channelsbar.modals.workspace_channel_list.workspace_channel_row.tag',
              )}
            </Typography.Text>
          </Tag>
        </Col>
      )}
    </Row>
  );
};
