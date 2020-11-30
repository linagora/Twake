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
import _ from 'lodash';

type Props = {
  title: string;
  channel?: ChannelType;
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
    const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
    const ChannelsCollections = Collections.get(collectionPath, ChannelResource);

    if (channel?.id) {
      const insertedChannel = await ChannelsCollections.findOne(channel.id);
      insertedChannel.data = _.assign(insertedChannel.data, {
        name: newChannel.name || channel.name,
        description: newChannel.description || channel.description,
        icon: newChannel.icon || channel.icon,
        visibility: newChannel.visibility || channel.visibility,
      });
      await ChannelsCollections.upsert(insertedChannel);
    } else {
      await ChannelsCollections.upsert(new ChannelResource(newChannel));
    }
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

            if (!channel?.id) {
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
            } else return ModalManager.close();
          }}
        >
          {Languages.t(channel?.id ? 'general.edit' : 'general.create')}
        </Button>
      }
    >
      <ChannelTemplateEditor
        channel={channel}
        onChange={onChange}
        isCurrentUserAdmin={isCurrentUserAdmin}
        currentUserId={currentUserId}
      />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
