import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import UserListManager from 'components/UserListManager/UserListManager';
import { ObjectModal } from 'components/ObjectModal/DeprecatedObjectModal.js';
import RouterServices from 'app/services/RouterService';
import { ChannelMemberResource } from 'app/models/Channel';
import Collections from 'services/CollectionsReact/Collections';

import { Typography, Button } from 'antd';

type Props = {
  onEdit?: any;
  onClose?: any;
  channelName?: string;
  companyId: string;
  workspaceId: string;
  channelId: string;
};

const { Title } = Typography;

const ChannelMembersEditor: FC<Props> = props => {
  const [memberList, setMemberList] = useState<string[]>([]);

  const addAllUsers = async () => {
    const collectionPath: string = `/channels/v1/companies/${props.companyId}/workspaces/${props.workspaceId}/channels/${props.channelId}/members/`;
    const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

    memberList.map(async (id: string) => {
      console.log(collectionPath);
      await channelMembersCollection.upsert(
        new ChannelMemberResource({
          user_id: id,
          type: 'member', // "member" | "guest" | "bot",
        }),
      );
    });
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
            addAllUsers();
            return props.onClose();
          }}
          disabled={!memberList.length}
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
