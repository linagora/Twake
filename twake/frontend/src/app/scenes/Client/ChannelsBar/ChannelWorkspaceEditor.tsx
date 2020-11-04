import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor';
import ModalManager from 'services/Modal/ModalManager';
import { ObjectModal } from 'components/ObjectModal/ObjectModal.js';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { Typography, Button } from 'antd';

import { useParams } from 'react-router-dom';
import RouterServices from 'services/RouterServices';
import OldCollections from 'services/Depreciated/Collections/Collections';

type Props = {
  title: string;
  channel?: ChannelType;
};

const { Title } = Typography;

const ChannelWorkspaceEditor: FC<Props> = ({ title, channel }) => {
  const params: any = useParams();
  const workspaceId = RouterServices.translateToUUID(params.workspaceId);

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
      title={<Title level={3}>{Languages.t(title)}</Title>}
      onClose={() => ModalManager.closeAll()}
      noScrollBar={false}
      footer={
        <Button
          className="small"
          block={true}
          style={{
            width: 'auto',
            float: 'right',
            /*
            backgroundColor: 'var(--primary)',
            opacity: !disabled ? '0.7' : '1',
            color: 'var(--white)',
            */
          }}
          disabled={!disabled}
          onClick={() => upsertChannel()}
        >
          {Languages.t('general.continue', 'Continue')}
        </Button>
      }
    >
      <ChannelTemplateEditor channel={channel} onChange={onChange} />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
