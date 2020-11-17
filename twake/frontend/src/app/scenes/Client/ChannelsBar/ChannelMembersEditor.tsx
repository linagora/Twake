import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import UserListManager from 'components/UserListManager/UserListManager';
import { ObjectModal } from 'components/ObjectModal/DeprecatedObjectModal.js';
import RouterServices from 'services/RouterServices';
import { ChannelMemberResource } from 'app/models/Channel';
import Collections from 'services/CollectionsReact/Collections';

import { Typography, Button } from 'antd';

type Props = {
  onEdit?: any;
  onClose?: any;
  channelName?: string;
};

const { Title } = Typography;

const ChannelMembersEditor: FC<Props> = props => {
  const [MemberList, setMemberList] = useState<string[]>([]);
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();

  const getMembersList = async () => {
    const collectionPath: string = `/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/members/`;
    const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

    MemberList.map(async id => {
      await channelMembersCollection.insert(
        new ChannelMemberResource({
          user_id: id,
          type: 'member', // "member" | "guest" | "bot",
        }),
      );
    });
    const members = await channelMembersCollection.find({});
    return console.log('ChannelMembers', members);
  };

  return (
    <ObjectModal
      title={
        <Title level={5}>
          {Languages.t('scenes.client.channelbar.channelmemberseditor.title', [props.channelName])}
        </Title>
      }
      onClose={() => props.onClose()}
      noScrollBar={false}
      footer={
        <Button
          className="small"
          block={true}
          type="primary"
          style={{
            width: 'auto',
            float: 'right',
          }}
          onClick={() => {
            getMembersList();
            return props.onClose();
          }}
          disabled={!MemberList.length}
        >
          {Languages.t('general.add', 'Add')}
        </Button>
      }
    >
      <div
        className="x-margin"
        style={{
          minHeight: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <UserListManager
          users={[]}
          canRemoveMyself
          noPlaceholder
          scope="group"
          autoFocus
          onUpdate={(array: string[]) => setMemberList(array)}
        />
      </div>
    </ObjectModal>
  );
};

export default ChannelMembersEditor;
