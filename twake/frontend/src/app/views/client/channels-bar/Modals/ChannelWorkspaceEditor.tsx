import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages';
import ChannelTemplateEditor from 'app/views/client/channels-bar/Modals/ChannelTemplateEditor';
import ModalManager from 'app/components/modal/modal-manager';
import ObjectModal from 'components/object-modal/object-modal';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/features/channels/types/channel';
import { Button } from 'antd';
import ChannelMembersList from './ChannelMembersList';
import RouterServices from 'app/features/router/services/router-service';
import _ from 'lodash';
import MainViewService from 'app/services/AppView/MainViewService';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';

type Props = {
  title: string;
  channel?: ChannelType;
  currentUserId?: string;
  defaultVisibility?: ChannelType['visibility'];
};

const ChannelWorkspaceEditor: FC<Props> = ({
  title,
  channel,
  currentUserId,
  defaultVisibility,
}) => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();

  const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
  const ChannelsCollections = Collections.get(collectionPath, ChannelResource);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  let newChannel: ChannelType = {
    name: '',
    icon: '',
    visibility: 'public',
    company_id: companyId,
    workspace_id: workspaceId,
  };

  const onChange = (channelEntries: Partial<ChannelType>): ChannelType => {
    const shouldDisabled =
      ((channelEntries.name || '').trim().length ? false : true) ||
      _.isEqual(
        {
          channel_group: channelEntries.channel_group,
          description: channelEntries.description,
          icon: channelEntries.icon,
          is_default: channelEntries.is_default,
          name: channelEntries.name,
          visibility: channelEntries.visibility,
        },
        {
          channel_group: channel?.channel_group,
          description: channel?.description,
          icon: channel?.icon,
          is_default: channel?.is_default,
          name: channel?.name,
          visibility: channel?.visibility,
        },
      );

    setDisabled(shouldDisabled);
    return (newChannel = channelEntries);
  };

  const upsertChannel = async (): Promise<void> => {
    setLoading(true);

    const response = await ChannelAPIClient.save(newChannel, {
      companyId,
      workspaceId,
      channelId: channel?.id,
    });

    if (response && response?.id) {
      MainViewService.select(response.id, {
        app: {
          identity: {
            code: 'messages',
            name: '',
            icon: '',
            description: '',
            website: '',
            categories: [],
            compatibility: [],
          },
        },
        collection: ChannelsCollections, // To remove
        context: null,
        hasTabs: false,
      });

      if (!channel && !response.is_default) {
        // Show channel member list only for non default channel
        return ModalManager.open(<ChannelMembersList channel={response} closable />, {
          position: 'center',
          size: { width: '600px', minHeight: '329px' },
        });
      }
    }

    setLoading(false);

    ModalManager.close();
  };

  return (
    <ObjectModal
      title={Languages.t(title)}
      closable
      footer={
        <Button
          loading={loading}
          onClick={upsertChannel}
          className="small"
          block={true}
          type="primary"
          disabled={disabled}
          style={{
            width: 'auto',
            float: 'right',
          }}
        >
          {Languages.t(channel?.id ? 'general.save' : 'general.create')}
        </Button>
      }
    >
      <ChannelTemplateEditor
        channel={channel}
        onChange={onChange}
        currentUserId={currentUserId}
        defaultVisibility={defaultVisibility}
      />
    </ObjectModal>
  );
};

export default ChannelWorkspaceEditor;
