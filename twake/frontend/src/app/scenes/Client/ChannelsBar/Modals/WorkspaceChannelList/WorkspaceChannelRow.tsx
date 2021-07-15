import React, { createRef, useEffect } from 'react';

import { Col, Row, Tag, Typography } from 'antd';
import { capitalize } from 'lodash';
import Languages from 'services/languages/languages';
import Icon from 'components/Icon/Icon';
import RouterServices, { ClientStateType } from 'app/services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import { ChannelMemberResource, ChannelResource } from 'app/models/Channel';
import Emojione from 'app/components/Emojione/Emojione';
import UsersService from 'services/user/UserService';
import ModalManager from 'app/components/Modal/ModalManager';
import './ChannelRow.scss';

type PropsType = {
  channel: ChannelResource;
  joined: boolean;
  active: boolean;
};

export default ({ channel, joined, active }: PropsType) => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();

  const userId: string = UsersService.getCurrentUserId();

  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    }
  });

  const joinChannel = () => {
    const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/members/`;
    const channelMembersCollection = Collection.get(collectionPath, ChannelMemberResource);
    const findMember = channelMembersCollection.find({ user_id: userId });

    if (!findMember.length) {
      channelMembersCollection.insert(
        new ChannelMemberResource({
          channel_id: channel.data.id,
          user_id: userId,
          type: 'member',
        }),
      );
    }

    ModalManager.closeAll();
    return RouterServices.push(`/client/${workspaceId}/c/${channel.data.id}`);
  };

  return (
    <Row
      key={channel.key}
      ref={ref}
      justify="space-between"
      align="middle"
      className={`channel-row ${active ? 'channel-row-selected' : ''}`}
      onClick={joinChannel}
    >
      <Col style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ lineHeight: 0 }}>
          <Emojione type={channel.data.icon || ''} />
        </div>
        <span className="small-x-margin">
          <Typography.Text strong style={{ color: active ? 'var(--white)' : '' }}>
            {capitalize(channel.data.name)}
          </Typography.Text>
        </span>
        {channel.data.visibility === 'private' && <Icon type="lock" />}
      </Col>

      {!joined && channel.data.visibility === 'public' && (
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
