import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/Modals/ChannelTemplateEditor';
import ModalManager from 'services/Modal/ModalManager';
import { ObjectModal } from 'components/ObjectModal/DeprecatedObjectModal.js';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { Typography, Button } from 'antd';
import ChannelMembersEditor from 'scenes/Client/ChannelsBar/Modals/ChannelMembersEditor';
import RouterServices from 'app/services/RouterService';

type Props = {
  title: string;
  channel?: ChannelType;
};

const { Title } = Typography;

const ChannelWorkspaceEditor: FC<Props> = ({ title, channel }) => {
  const { workspaceId, companyId } = RouterServices.useStateFromRoute();

  const [disabled, setDisabled] = useState<boolean>(true);
  let newChannel: ChannelType = {
    name: '',
    icon: '',
    visibility: 'public',
    company_id: companyId,
    workspace_id: workspaceId,
  };

  const onChange = (channelEntries: ChannelType): ChannelType => {
    setDisabled(channelEntries.name?.length ? true : false);
    return (newChannel = channelEntries);
  };

  const upsertChannel = async (): Promise<any> => {
    const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
    const ChannelsCollections = Collections.get(collectionPath);

    await ChannelsCollections.upsert(new ChannelResource(newChannel));
  };

  return (
    <ObjectModal
      title={<Title level={5}>{Languages.t(title)}</Title>}
      onClose={() => ModalManager.closeAll()}
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
          disabled={!disabled}
          onClick={() => {
            upsertChannel();
            return ModalManager.open(
              <ChannelMembersEditor
                channelName={newChannel.name}
                onClose={() => ModalManager.closeAll()}
              />,
              {
                position: 'center',
                size: { width: '600px', minHeight: '329px' },
              },
            );
          }}
        >
          {Languages.t('general.create', 'Create')}
        </Button>
      }
    >
      <ChannelTemplateEditor channel={channel} onChange={onChange} />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
