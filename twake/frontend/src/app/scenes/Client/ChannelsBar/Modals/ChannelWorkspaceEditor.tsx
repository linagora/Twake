import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/Modals/ChannelTemplateEditor';
import ModalManager from 'app/components/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { Typography, Button } from 'antd';
import ChannelMembersList from './ChannelMembersList';
import RouterServices from 'app/services/RouterService';
import _ from 'lodash';

type Props = {
  title: string;
  channel?: ChannelResource;
  currentUserId?: string;
  defaultVisibility?: ChannelType['visibility'];
};

const ChannelWorkspaceEditor: FC<Props> = ({
  title,
  channel,
  currentUserId,
  defaultVisibility,
}) => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();

  const [disabled, setDisabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  let newChannel: ChannelType = {
    name: '',
    icon: '',
    visibility: 'public',
    company_id: companyId,
    workspace_id: workspaceId,
  };

  const onChange = (channelEntries: ChannelType): ChannelType => {
    setDisabled((channelEntries.name || '').trim().length ? true : false);
    return (newChannel = channelEntries);
  };

  const upsertChannel = async (): Promise<any> => {
    const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
    const ChannelsCollections = Collections.get(collectionPath, ChannelResource);

    setLoading(true);

    if (channel?.id) {
      const insertedChannel = ChannelsCollections.findOne(channel.id, { withoutBackend: true });
      insertedChannel.data = _.assign(insertedChannel.data, {
        name: newChannel.name || channel.data.name,
        description: newChannel.description,
        icon: newChannel.icon || channel.data.icon,
        is_default: newChannel.is_default || false,
        visibility:
          newChannel.visibility !== undefined ? newChannel.visibility : channel.data.visibility,
        channel_group:
          newChannel.channel_group !== undefined
            ? newChannel.channel_group
            : channel.data.channel_group,
      });
      await ChannelsCollections.upsert(insertedChannel);
      ModalManager.close();
    } else {
      const resource = await ChannelsCollections.upsert(new ChannelResource(newChannel), {
        waitServerReply: true,
      });

      if (resource) {
        return ModalManager.open(<ChannelMembersList channel={resource} closable />, {
          position: 'center',
          size: { width: '600px', minHeight: '329px' },
        });
      }
    }
  };

  return (
    <ObjectModal
      title={Languages.t(title)}
      closable
      footer={
        <Button
          loading={loading}
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
        currentUserId={currentUserId}
        defaultVisibility={defaultVisibility}
      />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
