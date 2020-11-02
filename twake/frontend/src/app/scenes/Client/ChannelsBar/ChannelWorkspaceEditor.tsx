import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor';
import MediumPopupComponent from 'services/mediumPopupManager/mediumPopupManager.js';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';

type Props = {
  title: string;
  channel?: ChannelType;
};

const ChannelWorkspaceEditor: FC<Props> = ({ title, channel }) => {
  const [newChannel, setNewChannel] = useState<ChannelType>({
    name: '',
    icon: '',
    company_id: '',
    workspace_id: '',
    visibility: 'private',
  });

  const collectionPath: string = `/companies/${newChannel.company_id}/workspaces/${newChannel.workspace_id}/channels/`;
  const ChannelsCollections = Collections.get(collectionPath);

  const onChange = (channelEntries: ChannelType): void => {
    return setNewChannel(Object.assign({}, channelEntries));
  };

  const upsertChannel = async (): Promise<any> => {
    await ChannelsCollections.upsert(new ChannelResource(newChannel));
    await MediumPopupComponent.closeAll();
  };

  return (
    <ObjectModal
      title={<ObjectModalTitle>{Languages.t(title)}</ObjectModalTitle>}
      onClose={() => MediumPopupComponent.closeAll()}
      noScrollBar={false}
      footer={
        <Button
          className="small primary"
          style={{ width: 'auto', float: 'right' }}
          disabled={!newChannel.name}
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
