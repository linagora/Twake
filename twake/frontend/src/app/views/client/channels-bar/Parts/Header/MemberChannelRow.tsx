import React, { useState } from 'react';

import { Button, Col, Row, Tag, Typography } from 'antd';
import { Mail, PlusCircle, Trash } from 'react-feather';

import { ChannelMemberResource } from 'app/features/channels/types/channel';
import { getUserParts } from 'app/components/member/user-parts';
import Languages from 'app/features/global/services/languages-service';
import './MemberChannelRow.scss';
import Menu from 'app/components/menus/menu';
import Icon from 'app/components/icon/icon';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import RouterServices from 'app/features/router/services/router-service';
import Collection from 'app/deprecated/CollectionsV2/Collection';
import UsersService from 'app/features/users/services/current-user-service';
import ModalManager from 'app/components/modal/modal-manager';
import { PendingEmailResource } from 'app/features/channel-members/types/pending-email';
import GuestManagementService from 'app/features/channel-members/service/guest-management-service';
import UserService from 'app/features/users/services/current-user-service';

const { Text } = Typography;

type Props = {
  channelId: string;
  userId?: string;
  inAddition?: boolean;
  collection: Collection<ChannelMemberResource | PendingEmailResource>;
  userType?: 'member' | 'guest' | 'bot' | 'pending-email';
  inPendingEmailAddition?: boolean;
  pendingEmailToAdd?: string;
  onPendingEmailAddition?: () => unknown;
  onPendingEmailDeletion?: () => unknown;
};

export default (props: Props): JSX.Element => {
  let userEvents: JSX.Element;
  const [isMember, setIsMember] = useState<boolean>(false);
  const [selected, setSelected] = useState<boolean>(false);
  const { workspaceId, companyId } = RouterServices.getStateFromRoute();
  const currentUserId: string = UsersService.getCurrentUserId();

  const { avatar, name, users, companyRole } = getUserParts({
    usersIds: [props.userId || ''] || [],
    max: 6,
    size: 24,
  });

  const addUser = async () => {
    await props.collection.upsert(
      new ChannelMemberResource({
        user_id: props.userId,
        channel_id: props.channelId,
        type: 'member', // "member" | "guest" | "bot",
      }),
    );
    return setIsMember(true);
  };

  const leaveChannel = async (channelId: string, userId: string) => {
    //Fixme, this is not pretty, we should find a way to do this in one line
    const channelMemberResource = new ChannelMemberResource({
      user_id: userId,
      channel_id: channelId,
      type: 'member', // "member" | "guest" | "bot",
    });
    channelMemberResource.setPersisted();
    await props.collection.upsert(channelMemberResource, { withoutBackend: true });
    await props.collection.remove(channelMemberResource);

    setIsMember(false);

    currentUserId === props.userId && ModalManager.close();
  };

  const savePendingEmail = () =>
    GuestManagementService.upsertPendingEmail({
      workspace_id: workspaceId || '',
      channel_id: props.channelId || '',
      company_id: companyId || '',
      email: props.pendingEmailToAdd || '',
    }).finally(props.onPendingEmailAddition);

  const removePendingEmail = async () => {
    const col = props.collection as Collection<PendingEmailResource>;
    const pendingEmail = col.findOne({ id: props.userId });
    return await GuestManagementService.deletePendingEmail(pendingEmail.data).finally(
      props.onPendingEmailDeletion,
    );
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
    let menu: any = [
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
    const col = props.collection as Collection<PendingEmailResource>;
    const pendingEmail = col.findOne({ id: props.userId });
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
              {pendingEmail.data.email}
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
      <Col flex={4}>
        <Text strong className="pending-email-text">
          {name}
        </Text>{' '}
        @{users[0]?.username}
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
