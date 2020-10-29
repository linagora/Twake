import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor';
import MediumPopupComponent from 'services/mediumPopupManager/mediumPopupManager.js';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import Collections, { Resource } from 'app/services/CollectionsReact/Collections';

type Props = {
  title: string;
  // Use this props to open/hide modal component
  visible: boolean;
  // Use real channel type
  channel?: Channel;
};

// To remove && Use real channel type
type Channel = {
  id?: string;
  name: string;
  description?: string;
  front_id: string;
  icon: string;
  members?: string[];
  original_group: string;
  original_workspace: string;
  private: boolean;
};

const ChannelWorkspaceEditor: FC<Props> = ({ title, channel, visible }) => {
  const [newChannel, setNewChannel] = useState<Channel>({
    name: '',
    front_id: '',
    icon: '',
    original_group: '',
    original_workspace: '',
    private: false,
  });

  const collectionPath: string = `/companies/${newChannel.original_group}/workspaces/${newChannel.original_workspace}/channels/`;
  const ChannelsCollections = Collections.get(collectionPath);

  const getNewChannelEntries = (channelEntries: Channel): void => {
    return setNewChannel(Object.assign({}, channelEntries));
  };

  const updateChannel = async (): Promise<any> => {
    // TODO use class based on the resource
    await ChannelsCollections.update(new Resource<Channel>(newChannel));
    await getChannels();
  };

  const insertChannel = async (): Promise<any> => {
    // TODO use class based on the resource
    await ChannelsCollections.insert(new Resource<Channel>(newChannel));
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
      <ChannelTemplateEditor channel={channel} newChannel={getNewChannelEntries} disableButton />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
