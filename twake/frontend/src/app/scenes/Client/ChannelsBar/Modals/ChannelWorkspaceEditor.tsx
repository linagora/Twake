import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/Modals/ChannelTemplateEditor';
import ModalManager from 'app/components/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { Typography, Button } from 'antd';
import ChannelMembersEditor from 'scenes/Client/ChannelsBar/Modals/ChannelMembersEditor';
import RouterServices from 'app/services/RouterService';
import _ from 'lodash';

type Props = {
  title: string;
  channel?: ChannelResource;
  isCurrentUserAdmin?: boolean;
  currentUserId?: string;
};

const { Title } = Typography;

const ChannelWorkspaceEditor: FC<Props> = ({
  title,
  channel,
  isCurrentUserAdmin,
  currentUserId,
}) => {
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
    const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
    const ChannelsCollections = Collections.get(collectionPath, ChannelResource);

    if (channel?.id) {
      const insertedChannel = await ChannelsCollections.findOne(channel.id);
      insertedChannel.data = _.assign(insertedChannel.data, {
        name: newChannel.name || channel.data.name,
        description: newChannel.description || channel.data.description,
        icon: newChannel.icon || channel.data.icon,
        visibility: newChannel.visibility || channel.data.visibility,
      });
      await ChannelsCollections.upsert(insertedChannel);
      ModalManager.close();
    } else {
      const resource = await ChannelsCollections.upsert(new ChannelResource(newChannel), {
        waitServerReply: true,
      });

      if (resource) {
        return ModalManager.open(
          <ChannelMembersEditor
            companyId={resource.data.company_id || ''}
            workspaceId={resource.data.workspace_id || ''}
            channelId={resource.data.id || ''}
            channelName={resource.data.name}
            onClose={() => ModalManager.closeAll()}
          />,
          {
            position: 'center',
            size: { width: '600px', minHeight: '329px' },
          },
        );
      }
    }
  };

  return (
    <ObjectModal
      title={Languages.t(title)}
      closable
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
          }}
        >
          {Languages.t(channel?.id ? 'general.edit' : 'general.create')}
        </Button>
      }
    >
      <ChannelTemplateEditor
        channel={channel?.data}
        onChange={onChange}
        isCurrentUserAdmin={isCurrentUserAdmin}
        currentUserId={currentUserId}
      />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
