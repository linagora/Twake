import React from 'react';
import { Button, Col, Row, Typography } from 'antd';
import Emojione from 'app/components/Emojione/Emojione';
import { startCase } from 'lodash';
import ModalManager from 'services/Modal/ModalManager';
import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';
import RouterServices from 'app/services/RouterService';
import MainViewService from 'app/services/AppView/MainViewService';
import { Lock, Star } from 'react-feather';
import Search from '../Search';
import ChannelUsersHeader from './ChannelUsersHeader';
import { StarFilled } from '@ant-design/icons';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import { ChannelResource } from 'app/models/Channel';
import ChannelAvatars from './ChannelAvatars';

export default (): JSX.Element => {
  const { channelId } = RouterServices.useStateFromRoute();

  MainViewService.useWatcher(() => !!MainViewService.getViewCollection());
  const channelCollection = MainViewService.getViewCollection();
  if (!channelCollection?.useWatcher) {
    return <Col></Col>;
  }

  const channel: ChannelResource = channelCollection.useWatcher({
    id: channelId,
  })[0];

  if (!channel) {
    return <Col></Col>;
  }

  return (
    <Row
      justify="space-between"
      align="middle"
      style={{ lineHeight: '47px', padding: 0, flexWrap: 'nowrap' }}
    >
      {channel.data.visibility === 'direct' && <ChannelUsersHeader channel={channel.data} />}
      {channel.data.visibility !== 'direct' && (
        <Col flex="auto">
          <span
            className="left-margin text-overflow"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <div className="small-right-margin" style={{ lineHeight: 0, width: 16 }}>
              <Emojione type={channel.data.icon || ''} />
            </div>
            <Typography.Text className="small-right-margin" strong>
              {startCase(channel.data.name)}
            </Typography.Text>
            {channel.data.visibility === 'private' && (
              <Lock size={16} className="small-right-margin" />
            )}
            <Typography.Text className="markdown" style={{ lineHeight: '16px' }}>
              {PseudoMarkdownCompiler.compileToHTML(
                PseudoMarkdownCompiler.compileToJSON(
                  (channel.data.description || '').replace(/\n/g, ' '),
                ),
              )}
            </Typography.Text>
          </span>
        </Col>
      )}

      <Col>
        <Row align="middle" gutter={[8, 0]} style={{ flexWrap: 'nowrap' }}>
          {channel.data.visibility !== 'direct' && channel.data.workspace_id && (
            <div className="small-right-margin" style={{ display: 'inline', lineHeight: 0 }}>
              <ChannelAvatars workspaceId={channel.data.workspace_id} />
            </div>
          )}
          <div className="small-right-margin">
            {channel.data.visibility !== 'direct' && (
              <Button
                size="small"
                type="text"
                onClick={() => {
                  ModalManager.open(<ChannelMembersList channel={channel} closable />, {
                    position: 'center',
                    size: { width: '500px', minHeight: '329px' },
                  });
                }}
              >
                <Typography.Text>Members</Typography.Text>
              </Button>
            )}
            <Button size="small" type="text" onClick={() => {}}>
              <Typography.Text>
                {channel.data.user_member?.favorite && (
                  <StarFilled size={12} style={{ color: 'var(--grey-dark)', marginRight: 4 }} />
                )}
                Favorite
              </Typography.Text>
            </Button>
          </div>
          <Search />
        </Row>
      </Col>
    </Row>
  );
};
