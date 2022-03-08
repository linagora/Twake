import React, { useEffect, useState } from 'react';
import { capitalize } from 'lodash';
import { Input, Row, Typography } from 'antd';
import PerfectScrollbar from 'react-perfect-scrollbar';

import ObjectModal from 'app/components/object-modal/object-modal';
import MemberChannelRow from '../Parts/Header/MemberChannelRow';
import { ChannelType } from 'app/features/channels/types/channel';
import GuestManagementService from 'app/features/channel-members/service/guest-management-service';
import WorkspacesUsers from 'app/features/workspace-members/services/workspace-members-service';
import Languages from 'app/features/global/services/languages-service';
import { usePendingEmails } from 'app/features/pending-emails/hooks/use-pending-emails';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';
import { useChannelGuests } from 'app/features/channel-members/hooks/use-channel-guests';

type PropsType = {
  channel: ChannelType;
};

export default ({ channel }: PropsType): JSX.Element => {
  const [search, setSearch] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [shouldDisplayAdditionRow, setShouldDisplayAdditionRow] = useState<boolean>(false);
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();

  const { pendingEmails } = usePendingEmails({
    companyId,
    workspaceId,
    channelId: channel.id || '',
  });
  const { channelGuests } = useChannelGuests({
    companyId,
    workspaceId,
    channelId: channel.id || '',
  });

  GuestManagementService.bind({
    search,
    pendingEmails: pendingEmails.map(o => o),
    channelMembers: channelGuests.map(o => o),
  });

  const { list } = GuestManagementService;

  useEffect(() => {
    const searchedEmail = WorkspacesUsers.fullStringToEmails(search)[0] as string;
    const searchedEmailAlreadyAdded = list.some(item => item.filterString === searchedEmail);
    const displayAdditionRow = (searchedEmail || '').length && !searchedEmailAlreadyAdded;

    if (displayAdditionRow) {
      setShouldDisplayAdditionRow(true);
    } else setShouldDisplayAdditionRow(false);
  }, [list, search]);

  const shouldDisplayMemberRow = list.length > 0;
  const shouldDisplayTips = !shouldDisplayMemberRow && !shouldDisplayAdditionRow;
  const shouldDisplayLoader = list.length > limit;
  return (
    <ObjectModal
      title={Languages.t('scenes.client.channels_bar.modals.guest_management.title', [
        capitalize(channel.name),
      ])}
      closable
    >
      <Row className="x-margin">
        <Input
          placeholder={Languages.t(
            'scenes.client.channels_bar.modals.guest_management.input_placeholder',
          )}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Row>
      <PerfectScrollbar
        style={{
          maxHeight: '240px',
          height: '240px',
          width: '100%',
          marginTop: 8,
          paddingBottom: 8,
        }}
        component="div"
        options={{ suppressScrollX: true, suppressScrollY: false }}
      >
        {shouldDisplayAdditionRow && (
          <MemberChannelRow
            channelId={channel.id || ''}
            userType="pending-email"
            inPendingEmailAddition
            pendingEmailToAdd={search}
            onPendingEmailAddition={() => setShouldDisplayAdditionRow(false)}
          />
        )}
        {shouldDisplayMemberRow &&
          list.map(
            (member, index) =>
              index < limit && (
                <div key={member.key} className="x-margin">
                  <MemberChannelRow
                    key={member.key}
                    channelId={member.resource.channel_id || ''}
                    userId={
                      member.type === 'pending-email'
                        ? member.key
                        : (member.resource as ChannelMemberType).user_id || ''
                    }
                    userType={member.type}
                  />
                </div>
              ),
          )}
        {shouldDisplayLoader && (
          <Row align="middle" justify="center" style={{ height: 44 }}>
            <Typography.Link onClick={() => setLimit(limit + 10)}>
              {Languages.t('scenes.client.channelbar.channelmemberslist.loader')}
            </Typography.Link>
          </Row>
        )}
        {shouldDisplayTips && (
          <Row align="middle" justify="center" style={{ height: '100%' }}>
            <Typography.Text type="secondary">
              {Languages.t('scenes.client.channels_bar.modals.guest_management.tips')}
            </Typography.Text>
          </Row>
        )}
      </PerfectScrollbar>
    </ObjectModal>
  );
};
