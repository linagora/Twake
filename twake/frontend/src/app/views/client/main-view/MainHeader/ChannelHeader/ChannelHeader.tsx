import { Button, Col, Row, Typography } from 'antd';
import { File, Info, Lock, Users } from 'react-feather';

import Emojione from 'app/components/emojione/emojione';
import ModalManager from 'app/components/modal/modal-manager';
import { useUsersSearchModal } from 'app/features/channel-members-search/state/search-channel-member';
import { useChannel } from 'app/features/channels/hooks/use-channel';
import ChannelsBarService from 'app/features/channels/services/channels-bar-service';
import { channelAttachmentListState } from 'app/features/channels/state/channel-attachment-list';
import Languages from 'app/features/global/services/languages-service';
import PseudoMarkdownCompiler from 'app/features/global/services/pseudo-markdown-compiler-service';
import RouterServices from 'app/features/router/services/router-service';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { useUsersListener } from 'app/features/users/hooks/use-users-listener';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import ChannelWorkspaceEditor from 'app/views/client/channels-bar/Modals/ChannelWorkspaceEditor';
import { useRecoilState } from 'recoil';
import SearchInput from '../Search';
import ChannelAvatars from './ChannelAvatars';
import ChannelUsersHeader from './ChannelUsersHeader';

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId } = RouterServices.getStateFromRoute();
  const { channel } = useChannel(channelId || '');
  const members = channel?.members || [];
  const [, setChannelAttachmentState] = useRecoilState(channelAttachmentListState);
  const { user: currentUser } = useCurrentUser();
  const canAccessChannelParameters =
    AccessRightsService.hasLevel(workspaceId, 'member') &&
    AccessRightsService.getCompanyLevel(companyId) !== 'guest';

  const { setOpen: setParticipantsOpen } = useUsersSearchModal();

  useUsersListener(members);

  if (!channel) {
    return <Col></Col>;
  }

  if (!channel.user_member?.user_id) {
    ChannelsBarService.updateCurrentChannelId(companyId, workspaceId, '');
  }

  ChannelsBarService.updateCurrentChannelId(companyId, workspaceId, channelId);

  return (
    <div
      className="flex flex-nowrap items-center px-2 h-10"
      style={{ lineHeight: '47px', flexWrap: 'nowrap' }}
    >
      {
        // Temporary, it's for spacing when the hamburger menu is displayed
        <Col xs={1} sm={1} md={1} lg={0} xl={0} xxl={0}></Col>
      }
      {channel.visibility === 'direct' && (
        <Col className="grow overflow-hidden text-ellipsis whitespace-nowrap">
          <ChannelUsersHeader channel={channel} />
        </Col>
      )}
      {channel.visibility !== 'direct' && (
        <Col className="grow overflow-hidden text-ellipsis whitespace-nowrap">
          <span
            className="ml-2 text-overflow channel-name"
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
        {!!channel.user_member?.user_id && (
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
              <>
                {canAccessChannelParameters && (
                  <Button
                    size="small"
                    type="text"
                    className="px-1"
                    onClick={() => {
                      ModalManager.open(
                        <ChannelWorkspaceEditor
                          title={Languages.t('scenes.app.channelsbar.modify_channel_menu')}
                          channel={channel || {}}
                          currentUserId={currentUser?.id}
                        />,
                        {
                          position: 'center',
                          size: { width: '600px' },
                        },
                      );
                    }}
                  >
                    <Info className="h-5" />
                  </Button>
                )}
                <Button
                  size="small"
                  type="text"
                  className="px-1"
                  onClick={() => setParticipantsOpen(true)}
                >
                  <Users className="h-5" />
                </Button>
              </>
            )}
            <Button
              size="small"
              type="text"
              className="w-auto px-1 mr-2"
              onClick={() => {
                setChannelAttachmentState(true);
              }}
            >
              <File className="h-5" />
            </Button>
          </Row>
        )}
      </Col>

      <div className="w-2"></div>

      <SearchInput />
    </div>
  );
};
