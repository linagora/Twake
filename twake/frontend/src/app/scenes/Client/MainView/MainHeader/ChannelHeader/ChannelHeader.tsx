import React from 'react';
import { Button, Col, Row, Typography } from 'antd';
import Emojione from 'app/components/Emojione/Emojione';
import ModalManager from 'app/components/Modal/ModalManager';
import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';
import RouterServices from 'app/services/RouterService';
import MainViewService from 'app/services/AppView/MainViewService';
import { Lock } from 'react-feather';
import SearchInput from '../Search';
import ChannelUsersHeader from './ChannelUsersHeader';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import { ChannelResource } from 'app/models/Channel';
import ChannelAvatars from './ChannelAvatars';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelMemberResource } from 'app/models/Channel';
import Languages from 'services/languages/languages';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import { useUsersListener } from 'app/services/user/hooks/useUsersListener';

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId } = RouterServices.getStateFromRoute();

  const redirectToWorkspace = () => {
    const url = RouterServices.generateRouteFromState({
      workspaceId: workspaceId,
      channelId: '',
    });
    return RouterServices.push(url);
  };

  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${
    channelId || channelId
  }/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

  const members = channelMembersCollection
    .useWatcher({}, { limit: 10 })
    .map(i => i.data.user_id || '');
  useUsersListener(members);

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

  if (!channel.data.user_member?.user_id) {
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
      {channel.data.visibility === 'direct' && (
        <Col xs={21} sm={21} md={22} lg={12} xl={14} xxl={16}>
          <ChannelUsersHeader channel={channel.data} />
        </Col>
      )}
      {channel.data.visibility !== 'direct' && (
        <Col xs={21} sm={21} md={22} lg={12} xl={14} xxl={16}>
          <span
            className="left-margin text-overflow"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <div className="small-right-margin" style={{ lineHeight: 0, width: 16 }}>
              <Emojione type={channel.data.icon || ''} />
            </div>
            <Typography.Text className="small-right-margin" strong>
              {channel.data.name}
            </Typography.Text>
            {channel.data.visibility === 'private' && (
              <Lock size={16} className="small-right-margin" />
            )}
            <Typography.Text ellipsis className="markdown" style={{ lineHeight: '16px' }}>
              {PseudoMarkdownCompiler.compileToHTML(
                PseudoMarkdownCompiler.compileToJSON(
                  (channel.data.description || '').replace(/\n/g, ' '),
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
          {channel.data.visibility !== 'direct' && channel.data.workspace_id && (
            <div className="small-right-margin" style={{ display: 'inline', lineHeight: 0 }}>
              <ChannelAvatars workspaceId={channel.data.workspace_id} />
            </div>
          )}
          {channel.data.visibility !== 'direct' && (
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
