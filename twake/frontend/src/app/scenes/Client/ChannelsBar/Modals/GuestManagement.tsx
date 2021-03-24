import ObjectModal from 'app/components/ObjectModal/ObjectModal';
import RouterService from 'app/services/RouterService';
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import MemberChannelRow from '../Parts/Header/MemberChannelRow';
import { ChannelResource, ChannelMemberResource } from 'app/models/Channel';
import Collections from 'services/CollectionsReact/Collections';

type PropsType = {
  channel: ChannelResource;
};

const GuestManagement = ({ channel }: PropsType): JSX.Element => {
  const { workspaceId, companyId } = RouterService.getStateFromRoute();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);
  const channelMembers = channelMembersCollection.useWatcher({} /*{ limit: limit }*/);

  return (
    // TODO Translation
    <ObjectModal title={`Manage guests in ${channel.data.name}`} closable>
      <PerfectScrollbar
        style={{ maxHeight: '240px', height: '240px', width: '100%', paddingBottom: 8 }}
        component="div"
        options={{ suppressScrollX: true, suppressScrollY: false }}
      >
        {channelMembers.length > 0 &&
          channelMembers
            .filter(member => member.data.type === 'guest')
            .map(member => (
              <div key={member.id} className="x-margin" style={{ marginTop: 8 }}>
                <MemberChannelRow
                  key={member.id}
                  channelId={channel.id}
                  userId={member.data.user_id || ''}
                  collection={channelMembersCollection}
                  userType={member.data.type}
                />
              </div>
            ))}
      </PerfectScrollbar>
    </ObjectModal>
  );
};

export default GuestManagement;
