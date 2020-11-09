import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor';
import ModalManager from 'services/Modal/ModalManager';
import { ObjectModal } from 'components/ObjectModal/ObjectModal.js';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { Typography, Button } from 'antd';

import RouterServices from 'services/RouterServices';
import OldCollections from 'services/Depreciated/Collections/Collections';

import ChannelMembersEditor from 'scenes/Client/ChannelsBar/ChannelMembersEditor';

type Props = {
  title: string;
  channel?: ChannelType;
};

const { Title } = Typography;

const ChannelWorkspaceEditor: FC<Props> = ({ title, channel }) => {
  const { workspaceId } = RouterServices.useStateFromRoute();

  const [disabled, setDisabled] = useState<boolean>(true);
  let newChannel: ChannelType = {
    name: '',
    icon: '',
    visibility: 'private',
    // TODO find a better way to get company id and workspace id
    company_id: OldCollections.get('workspaces').find(workspaceId)?.group?.id,
    workspace_id: workspaceId,
  };

  const collectionPath: string = `/companies/${newChannel.company_id}/workspaces/${newChannel.workspace_id}/channels/`;
  const ChannelsCollections = Collections.get(collectionPath);

  const onChange = (channelEntries: ChannelType): ChannelType => {
    setDisabled(channelEntries.name?.length ? true : false);
    return (newChannel = channelEntries);
  };

  const upsertChannel = async (): Promise<any> => {
    await ChannelsCollections.upsert(new ChannelResource(newChannel));
    return ModalManager.closeAll();
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
            return ModalManager.open(
              <ChannelMembersEditor onClose={() => ModalManager.closeAll()} />,
              {
                position: 'center',
                size: { width: '600px', minHeight: '329px' },
              },
            );

            /*upsertChannel()*/
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
