import React from 'react';
import { Avatar, Button, Col, Row, Space, Typography } from 'antd';
import Emojione from 'app/components/Emojione/Emojione';
import { startCase } from 'lodash';
import ModalManager from 'services/Modal/ModalManager';
import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';
import RouterServices from 'app/services/RouterService';
import ChannelsService from 'app/services/channels/ChannelsService';
import { Lock, Star } from 'react-feather';
import Search from '../Search';
import ChannelUsersHeader from './ChannelUsersHeader';
import { StarFilled } from '@ant-design/icons';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import UsersService from 'services/user/user.js';
import { getChannelParts, useChannelListener } from 'app/components/Channel/UserChannelParts';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelMemberResource } from 'app/models/Channel';

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();

  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${
    channelId || channelId
  }/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

  const members = channelMembersCollection
    .useWatcher({}, { limit: 10 })
    .map(i => i.data.user_id || '');
  useChannelListener(members);
  const [avatar] = getChannelParts({ usersIds: members, keepMyself: true, max: 10 });

  ChannelsService.useWatcher(() => !!ChannelsService.getCurrentChannelCollection());
  const channelCollection = ChannelsService.getCurrentChannelCollection();
  if (!channelCollection?.useWatcher) {
    return <Col></Col>;
  }
  const channel = channelCollection.useWatcher({ id: channelId })[0];

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
          {channel.data.visibility !== 'direct' && (
            <div className="small-right-margin" style={{ display: 'inline', lineHeight: 0 }}>
              {avatar}
            </div>
          )}
          <div className="small-right-margin">
            {channel.data.visibility !== 'direct' && (
              <Button
                size="small"
                type="text"
                onClick={() => {
                  ModalManager.open(
                    <ChannelMembersList
                      channelId={channelId}
                      channelName={channel.data.name}
                      closable
                    />,
                    {
                      position: 'center',
                      size: { width: '500px', minHeight: '329px' },
                    },
                  );
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
