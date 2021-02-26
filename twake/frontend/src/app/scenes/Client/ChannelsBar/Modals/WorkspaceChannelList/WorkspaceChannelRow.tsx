import React, { useState } from 'react';

import { Button, Col, Row, Tooltip } from 'antd';
import { capitalize } from 'lodash';
import Languages from 'services/languages/languages.js';
import Icon from 'components/Icon/Icon';
import RouterServices, { ClientStateType } from 'app/services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import { ChannelMemberResource, ChannelResource } from 'app/models/Channel';
import Emojione from 'app/components/Emojione/Emojione';
import UsersService from 'services/user/user.js';
import ModalManager from 'app/components/Modal/ModalManager';

type PropsType = {
  channel: ChannelResource;
  joined: boolean;
};

export default ({ channel, joined }: PropsType) => {
  const { companyId, workspaceId }: ClientStateType = RouterServices.useRouteState(
    ({ companyId, workspaceId }) => {
      return { companyId, workspaceId };
    },
  );
  const userId: string = UsersService.getCurrentUserId();

  const joinChannel = (): void => {
    const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/members/`;
    const channelMembersCollection = Collection.get(collectionPath, ChannelMemberResource);
    channelMembersCollection.insert(
      new ChannelMemberResource({
        channel_id: channel.data.id,
        user_id: userId,
        type: 'member',
      }),
    );
  };

  const buttonStyle: { [key: string]: string } = {
    minWidth: '42px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: joined ? 'var(--grey-dark)' : '',
    backgroundColor: joined ? 'var(--grey-background)' : 'var(--primary)',
  };

  return (
    <Row
      style={{ lineHeight: '47px' }}
      key={channel.key}
      justify="space-between"
      align="middle"
      className="x-margin"
    >
      <Col
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={() => {
          if (joined) {
            ModalManager.closeAll();
            return RouterServices.history.push(`/client/${workspaceId}/c/${channel.data.id}`);
          }
        }}
      >
        <div style={{ lineHeight: 0 }}>
          <Emojione type={channel.data.icon || ''} />
        </div>
        <span className="small-x-margin">{capitalize(channel.data.name)}</span>
        {channel.data.visibility === 'private' && <Icon type="lock" />}
      </Col>
      <Col>
        <Tooltip
          title={
            joined
              ? ''
              : channel.data.visibility !== 'public'
              ? 'You see this channel because you are an administrator'
              : ''
          }
        >
          <Button
            disabled={joined || channel.data.visibility !== 'public' ? true : false}
            type={joined || channel.data.visibility !== 'public' ? 'default' : 'primary'}
            style={{}}
            size="small"
            onClick={joinChannel}
          >
            {Languages.t(
              joined
                ? 'components.channelworkspacelist.button_joined'
                : 'components.channelworkspacelist.button_join',
            )}
          </Button>
        </Tooltip>
      </Col>
    </Row>
  );
};
