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

type PropsType = {
  channel: ChannelResource;
};

const GuestManagement = ({ channel }: PropsType): JSX.Element => {
  const [search, setSearch] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);

  const { workspaceId, companyId } = RouterService.getStateFromRoute();
  const { list } = GuestManagementService;

  const memberCollectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/members/`;
  const channelMembersCollection = Collections.get(memberCollectionPath, ChannelMemberResource);

  const pendingEmailsCollectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/pending_emails/`;
  const pendingEmailsCollection = Collections.get(
    pendingEmailsCollectionPath,
    PendingEmailResource,
  );

  useEffect(() => {
    GuestManagementService.bind({ search, channel_id: channel.data.id || '' });
    list.length === 0 && setLimit(10);
    return () => GuestManagementService.destroyList();
  }, [search, list, limit]);

  const shouldDisplayAdditionRow =
    list.length === 0 && WorkspacesUsers.fullStringToEmails(search).length === 1;
  const shouldDisplayMemberRow = list.length > 0;
  const shouldDisplayTips = !shouldDisplayMemberRow && !shouldDisplayAdditionRow;
  const shouldDisplayLoader = list.length > limit;
  return (
    // TODO Translation
    <ObjectModal title={`Manage guests in ${channel.data.name}`} closable>
      <Row className="x-margin">
        {/* TODO TRANSLATION HERE */}
        <Input
          placeholder="Search between guests and pending emails"
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
            channelId={channel.data.id || ''}
            collection={pendingEmailsCollection}
            userType="pending-email"
            inPendingEmailAddition
            pendingEmailToAdd={search}
            onPendingEmailAddition={() => setSearch('')}
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
                    onPendingEmailDeletion={() => setSearch('')}
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
            <Typography.Link onClick={() => setLimit(limit + 10)}>Load more</Typography.Link>
          </Row>
        )}
        {shouldDisplayTips && (
          <Row align="middle" justify="center" style={{ height: '100%' }}>
            <Typography.Text type="secondary">
              Start adding or searching email by using the input above
            </Typography.Text>
          </Row>
        )}
      </PerfectScrollbar>
    </ObjectModal>
  );
};

export default GuestManagement;
