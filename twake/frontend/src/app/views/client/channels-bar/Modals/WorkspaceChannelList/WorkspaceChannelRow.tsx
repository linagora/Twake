import React, { createRef, useEffect } from 'react';

import { Col, Row, Tag, Typography } from 'antd';
import { capitalize } from 'lodash';
import Languages from 'app/features/global/services/languages-service';
import Icon from 'app/components/icon/icon';
import RouterServices from 'app/features/router/services/router-service';
import { ChannelType } from 'app/features/channels/types/channel';
import Emojione from 'app/components/emojione/emojione';
import UsersService from 'app/features/users/services/current-user-service';
import ModalManager from 'app/components/modal/modal-manager';
import ChannelsReachableAPIClient from 'app/features/channels/api/channels-reachable-api-client';
import { useFavoriteChannels } from 'app/features/channels/hooks/use-favorite-channels';
import ChannelMembersAPIClient from 'app/features/channel-members/api/channel-members-api-client';

import './ChannelRow.scss';
import { useChannel } from 'app/features/channels/hooks/use-channel';

type PropsType = {
  channel: ChannelType;
  joined: boolean;
  active: boolean;
};

export default ({ channel, joined, active }: PropsType) => {
  const { refresh: refreshFavoriteChannels } = useFavoriteChannels();
  const userId: string = UsersService.getCurrentUserId();
  const { refresh: refreshChannel } = useChannel(channel.id || '');

  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    }
  });

  const joinChannel = async () => {
    if (channel.company_id && channel.workspace_id && channel.id) {
      const channelMembers = await ChannelMembersAPIClient.list({
        companyId: channel.company_id,
        workspaceId: channel.workspace_id,
        channelId: channel.id,
      });

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

    refreshChannel();
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
