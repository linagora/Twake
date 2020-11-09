import React, { FC /*useState*/ } from 'react';
import Languages from 'services/languages/languages.js';
import UserListManager from 'components/UserListManager/UserListManager';
import { ObjectModal } from 'components/ObjectModal/ObjectModal.js';

import { Typography, Button } from 'antd';

type Props = {
  onEdit?: any;
  onClose?: any;
  channelName?: string;
};

const { Title } = Typography;

const ChannelMembersEditor: FC<Props> = props => {
  //const [MemberList, setMemberList] = useState<string[]>();
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
          onClick={() => props.onClose()}
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
          //onUpdate={(array: string[]) => setMemberList(array)}
        />
      </div>
    </ObjectModal>
  );
};

export default ChannelMembersEditor;
