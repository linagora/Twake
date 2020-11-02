import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor';
import MediumPopupComponent from 'services/mediumPopupManager/mediumPopupManager.js';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import Collections, { Resource } from 'app/services/CollectionsReact/Collections';
import { ChannelType } from 'app/models/Channel';

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

  const updateChannel = async (): Promise<any> => {
    // TODO use class based on the resource
    await ChannelsCollections.update(new Resource<ChannelType>(newChannel));
    await getChannels();
  };

  const insertChannel = async (): Promise<any> => {
    // TODO use class based on the resource

    // use upsert
    await ChannelsCollections.insert(new Resource<ChannelType>(newChannel));
    await getChannels();
  };

  const getChannels = async (): Promise<any> => {
    const channels = await ChannelsCollections.find({});
    console.log('Channels -->', channels);
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
          onClick={() => {
            //updateChannel()
            insertChannel();
          }}
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
