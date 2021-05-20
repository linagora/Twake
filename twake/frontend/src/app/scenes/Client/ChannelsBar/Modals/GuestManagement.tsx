import ObjectModal from 'app/components/ObjectModal/ObjectModal';
import RouterService from 'app/services/RouterService';
import React, { useEffect, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import MemberChannelRow from '../Parts/Header/MemberChannelRow';
import { ChannelMemberResource, ChannelResource } from 'app/models/Channel';
import Collections from 'services/CollectionsReact/Collections';
import { Input, Row, Typography } from 'antd';
import { PendingEmailResource } from 'app/models/PendingEmail';
import GuestManagementService from 'app/services/GuestManagementService';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import Languages from 'services/languages/languages.js';
import { capitalize } from 'lodash';

type PropsType = {
  channel: ChannelResource;
};

const GuestManagement = ({ channel }: PropsType): JSX.Element => {
  const [search, setSearch] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [shouldDisplayAdditionRow, setShouldDisplayAdditionRow] = useState<boolean>(false);
  const { workspaceId, companyId, channelId } = RouterService.getStateFromRoute();

  GuestManagementService.bind({ search, channel_id: channel.data.id || '' });
  const { list } = GuestManagementService;

  const memberCollectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/members/`;
  const channelMembersCollection = Collections.get(memberCollectionPath, ChannelMemberResource);

  const pendingEmailsCollectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/pending_emails/`;
  const pendingEmailsCollection = Collections.get(
    pendingEmailsCollectionPath,
    PendingEmailResource,
  );

  channelMembersCollection.useWatcher({});
  pendingEmailsCollection.useWatcher({});

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
        capitalize(channel.data.name),
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
        <button onClick={() => console.log({ companyId, workspaceId, channelId })}>
          ezaezaeza
        </button>
        {shouldDisplayAdditionRow && (
          <MemberChannelRow
            channelId={channel.data.id || ''}
            collection={pendingEmailsCollection}
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
                    channelId={member.resource.data.channel_id || ''}
                    userId={member.resource.data.id || ''}
                    collection={
                      member.type === 'pending-email'
                        ? pendingEmailsCollection
                        : channelMembersCollection
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

export default GuestManagement;
