import React, { useState } from 'react';

import { Button, Col, Row, Tag, Typography } from 'antd';
import { Mail, PlusCircle, Trash } from 'react-feather';

import { getUserParts } from 'app/components/member/user-parts';
import Languages from 'app/features/global/services/languages-service';
import Menu from 'app/components/menus/menu';
import Icon from 'app/components/icon/icon';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import UsersService from 'app/features/users/services/current-user-service';
import ModalManager from 'app/components/modal/modal-manager';
import UserService from 'app/features/users/services/current-user-service';
import ChannelsReachableAPIClient from 'app/features/channels/api/channels-reachable-api-client';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useChannelMembers } from 'app/features/channel-members/hooks/use-channel-members';
import { usePendingEmails } from 'app/features/pending-emails/hooks/use-pending-emails';
import PendingEmailsAPIClient from 'app/features/pending-emails/api/pending-emails-api-client';

import './MemberChannelRow.scss';

const { Text } = Typography;

type Props = {
  channelId: string;
  userId?: string;
  inAddition?: boolean;
  userType?: 'member' | 'guest' | 'bot' | 'pending-email';
  inPendingEmailAddition?: boolean;
  pendingEmailToAdd?: string;
  onPendingEmailAddition?: () => unknown;
  onPendingEmailDeletion?: () => unknown;
};

const MemberChannelRow = (props: Props): JSX.Element => {
  let userEvents: JSX.Element;
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [isMember, setIsMember] = useState<boolean>(false);
  const [selected, setSelected] = useState<boolean>(false);
  const { refresh: refreshChannelMembers } = useChannelMembers({
    companyId,
    workspaceId,
    channelId: props.channelId,
  });

  const { refresh: refreshPendingEmails } = usePendingEmails({
    companyId,
    workspaceId,
    channelId: props.channelId,
  });
  const currentUserId: string = UsersService.getCurrentUserId();

  const { avatar, name, users, companyRole } = getUserParts({
    usersIds: [props.userId || ''] || [],
    max: 6,
    size: 24,
  });

  const addUser = async () => {
    props.userId &&
      (await ChannelsReachableAPIClient.inviteUser(
        companyId,
        workspaceId,
        props.channelId,
        props.userId,
      )
        .then(refreshChannelMembers)
        .finally(() => setIsMember(true)));
  };

  const leaveChannel = async (channelId: string, userId: string) => {
    await ChannelsReachableAPIClient.removeUser(companyId, workspaceId, channelId, userId)
      .then(refreshChannelMembers)
      .finally(() => setIsMember(false));

    currentUserId === props.userId && ModalManager.close();
  };

  const savePendingEmail = () =>
    props.pendingEmailToAdd &&
    PendingEmailsAPIClient.save(props.pendingEmailToAdd, {
      companyId,
      workspaceId,
      channelId: props.channelId,
    }).finally(refreshPendingEmails);

  const removePendingEmail = async () => {
    props.userId &&
      props.userType === 'pending-email' &&
      PendingEmailsAPIClient.delete(props.userId, {
        companyId,
        workspaceId,
        channelId: props.channelId,
      }).finally(refreshPendingEmails);
  };

  if (props.inAddition) {
    const buttonStyle: { [key: string]: string } = {
      minWidth: '42px',
      height: '25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isMember ? 'var(--grey-dark)' : '',
      backgroundColor: isMember ? 'var(--grey-background)' : 'var(--primary)',
    };
    userEvents = (
      <Col>
        <Button type="primary" style={buttonStyle} disabled={isMember} onClick={() => addUser()}>
          {Languages.t('general.add')}
        </Button>
      </Col>
    );
  } else {
    const menu: any = [
      {
        text: (
          <div style={{ color: 'var(--red)' }}>
            {Languages.t(
              props.userId !== currentUserId
                ? 'scenes.client.channelbar.channelmemberslist.menu.option_2'
                : 'scenes.app.channelsbar.channel_leaving',
            )}
          </div>
        ),
        icon: <Trash size={16} color="var(--red)" />,
        onClick:
          props.userType !== 'pending-email'
            ? () => leaveChannel(props.channelId, props.userId || '')
            : removePendingEmail,
      },
    ];
    userEvents = (
      <Col>
        <div className="add more-icon">
          <Menu menu={menu} className="options" onClose={() => setSelected(false)}>
            <Icon type="ellipsis-h more-icon grey-icon" onClick={() => setSelected(true)} />
          </Menu>
        </div>
      </Col>
    );
  }

  if (!users[0] && props.userType !== 'pending-email') {
    return <></>;
  }

  if (props.inPendingEmailAddition) {
    return (
      <Row
        key={`key_${props.pendingEmailToAdd || ''}`}
        className="pending-email add-pending-email x-margin"
        align="middle"
        justify="space-between"
        onClick={savePendingEmail}
      >
        <Col className="small-left-margin" style={{ display: 'flex', alignItems: 'center' }}>
          <PlusCircle size={18} />
        </Col>
        <Col flex="auto" className="x-margin">
          {Languages.t('general.add')}{' '}
          <Typography.Text strong>{props.pendingEmailToAdd || ''}</Typography.Text>
        </Col>
      </Row>
    );
  }

  if (props.userType === 'pending-email') {
    const pendingEmail: string | undefined = props.userId;
    const shouldDisplayPendingRow = !!pendingEmail;

    if (shouldDisplayPendingRow) {
      return (
        <Row
          className={`pending-email ${selected ? 'selected' : ''}`}
          key={`key_${props.userId}`}
          align="middle"
          justify="space-between"
        >
          <Col className="small-x-margin" style={{ display: 'flex', alignItems: 'center' }}>
            <Mail size={18} />
          </Col>
          <Col flex="auto" className="small-right-margin">
            <Typography.Text type="secondary" className="pending-email-text">
              {pendingEmail}
            </Typography.Text>
          </Col>
          <Col>
            <Tag color="var(--warning)">
              {Languages.t(
                'scenes.client.channels_bar.modals.parts.channel_member_row.label.pending_email',
              )}
            </Tag>
          </Col>
          <Col className="small-right-margin">
            {AccessRightsService.hasLevel(workspaceId, 'member') &&
              AccessRightsService.getCompanyLevel(companyId) !== 'guest' &&
              userEvents}
          </Col>
        </Row>
      );
    } else return <></>;
  }

  return (
    <Row
      key={`key_${props.userId}`}
      align="middle"
      gutter={[0, 16]}
      className={`pending-email ${selected ? 'selected' : ''}`}
    >
      <Col className="small-x-margin">{avatar}</Col>
      <Col flex={4} className="username-col">
        <Text strong className="pending-email-text small-right-margin">
          {name}
        </Text>{' '}
        <Text ellipsis={true} style={{ maxWidth: 200 }}>
          @{users[0]?.username}
        </Text>
      </Col>
      <Col>
        {props.userId === currentUserId && (
          <Tag color="var(--green)">
            {Languages.t('scenes.client.channelbar.channelmemberslist.tag')}
          </Tag>
        )}
      </Col>
      {UserService.getUserRole(users[0], companyId) === 'guest' && <Col>{companyRole}</Col>}
      <Col className="small-right-margin">
        {AccessRightsService.hasLevel(workspaceId, 'member') &&
          AccessRightsService.getCompanyLevel(companyId) !== 'guest' &&
          userEvents}
      </Col>
    </Row>
  );
};

export default MemberChannelRow;
