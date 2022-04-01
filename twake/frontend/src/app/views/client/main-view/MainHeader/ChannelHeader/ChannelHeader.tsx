import React from 'react';
import { Lock } from 'react-feather';
import { Button, Col, Row, Typography } from 'antd';

import Emojione from 'app/components/emojione/emojione';
import ModalManager from 'app/components/modal/modal-manager';
import ChannelMembersList from 'app/views/client/channels-bar/Modals/ChannelMembersList';
import RouterServices from 'app/features/router/services/router-service';
import SearchInput from '../Search';
import ChannelUsersHeader from './ChannelUsersHeader';
import PseudoMarkdownCompiler from 'app/features/global/services/pseudo-markdown-compiler-service';
import ChannelAvatars from './ChannelAvatars';
import Languages from 'app/features/global/services/languages-service';
import ChannelsBarService from 'app/features/channels/services/channels-bar-service';
import { useUsersListener } from 'app/features/users/hooks/use-users-listener';
import { useChannel } from 'app/features/channels/hooks/use-channel';

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId } = RouterServices.getStateFromRoute();

  const redirectToWorkspace = () => {
    const url = RouterServices.generateRouteFromState({
      companyId,
      workspaceId,
      channelId: '',
    });
    return RouterServices.push(url);
  };

  const { channel } = useChannel(channelId || '');

  const members = channel?.members || [];

  useUsersListener(members);

  if (!channel) {
    return <Col></Col>;
  }

  if (!channel.user_member?.user_id) {
    ChannelsBarService.updateCurrentChannelId(companyId, workspaceId, '');
    redirectToWorkspace();
    return <Col></Col>;
  }

  ChannelsBarService.updateCurrentChannelId(companyId, workspaceId, channelId);

  return (
    <Row align="middle" style={{ lineHeight: '47px', padding: 0, flexWrap: 'nowrap' }}>
      {
        // Temporary, it's for spacing when the hamburger menu is displayed
        <Col xs={1} sm={1} md={1} lg={0} xl={0} xxl={0}></Col>
      }
      {channel.visibility === 'direct' && (
        <Col xs={21} sm={21} md={22} lg={12} xl={14} xxl={16}>
          <ChannelUsersHeader channel={channel} />
        </Col>
      )}
      {channel.visibility !== 'direct' && (
        <Col xs={21} sm={21} md={22} lg={12} xl={14} xxl={16}>
          <span
            className="left-margin text-overflow channel-name"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <div className="small-right-margin" style={{ lineHeight: 0, width: 16 }}>
              <Emojione type={channel.icon || ''} />
            </div>
            <Typography.Text className="small-right-margin" strong>
              {channel.name}
            </Typography.Text>
            {channel.visibility === 'private' && <Lock size={16} className="small-right-margin" />}
            <Typography.Text ellipsis className="markdown" style={{ lineHeight: '16px' }}>
              {PseudoMarkdownCompiler.compileToHTML(
                PseudoMarkdownCompiler.compileToJSON(
                  (channel.description || '').replace(/\n/g, ' '),
                ),
              )}
            </Typography.Text>
          </span>
        </Col>
      )}

      <Col xs={0} sm={0} md={0} lg={6} xl={5} xxl={4}>
        <Row
          align="middle"
          justify="end"
          gutter={[8, 0]}
          style={{ padding: 0, flexWrap: 'nowrap' }}
        >
          {channel.visibility !== 'direct' && channel.workspace_id && (
            <div className="small-right-margin" style={{ display: 'inline', lineHeight: 0 }}>
              <ChannelAvatars workspaceId={channel.workspace_id} />
            </div>
          )}
          {channel.visibility !== 'direct' && (
            <Button
              size="small"
              type="text"
              onClick={() => {
                ModalManager.open(<ChannelMembersList channel={channel} closable />, {
                  position: 'center',
                  size: { width: '600px', minHeight: '329px' },
                });
              }}
            >
              <Typography.Text>
                {Languages.t('scenes.apps.parameters.workspace_sections.members')}
              </Typography.Text>
            </Button>
          )}
        </Row>
      </Col>

      <SearchInput />
    </Row>
  );
};
