import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor';
import MediumPopupComponent from 'services/Modal/ModalManager';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';

import { useParams } from 'react-router-dom';
import RouterServices from 'services/RouterServices';
import OldCollections from 'services/Depreciated/Collections/Collections';

type Props = {
  title: string;
  channel?: ChannelType;
};

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
