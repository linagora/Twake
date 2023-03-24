import React, { useState, useEffect } from 'react';
import Languages from 'app/features/global/services/languages-service';
import InputWithIcon from 'components/inputs/input-with-icon';
import { ChannelType } from 'app/features/channels/types/channel';
import { Select, Typography, Checkbox, Input } from 'antd';
import InputWithSelect from 'app/components/inputs/input-with-select';
import RouterServices from 'app/features/router/services/router-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { usePublicOrPrivateChannels } from 'app/features/channels/hooks/use-public-or-private-channels';

type PropsType = {
  channel: ChannelType | undefined;
  onChange: (channelEntries: Partial<ChannelType>) => void;
  currentUserId?: string;
  defaultVisibility?: ChannelType['visibility'];
};

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const ChannelTemplateEditor = ({
  channel,
  onChange,
  currentUserId,
  defaultVisibility,
}: PropsType) => {
  const [icon, setIcon] = useState<string>(channel?.icon || '');
  const [name, setName] = useState<string>(channel?.name || '');
  const [description, setDescription] = useState<string>(channel?.description || '');
  const [visibility, setVisibility] = useState<'public' | 'direct' | 'private'>(
    channel?.visibility || defaultVisibility || 'public',
  );
  const [defaultChannel, setDefaultChannel] = useState<boolean>(channel?.is_default || false);
  const [group, setGroup] = useState<string>(channel?.channel_group || '');
  const { workspaceId } = RouterServices.getStateFromRoute();
  const { privateChannels, publicChannels } = usePublicOrPrivateChannels();
  useEffect(() => {
    onChange({
      icon,
      name,
      description,
      visibility,
      channel_group: group,
      is_default: defaultChannel,
    });
  });

  const getGroups = () => {
    const groupsNames: string[] = [];
    [...privateChannels, ...publicChannels]
      .sort((a, b) => (a.channel_group || '').localeCompare(b.channel_group || ''))
      .forEach(channel => {
        if (channel.channel_group && !groupsNames.includes(channel.channel_group))
          groupsNames.push(channel.channel_group);
      });
    return groupsNames;
  };

  const isAbleToEditVisibilityOrDefault = () => {
    const isNewChannel = !channel;
    const editable =
      (channel &&
        channel.id &&
        (AccessRightsService.hasLevel(workspaceId || '', 'moderator') ||
          currentUserId === channel.owner)) ||
      false;
    return isNewChannel || editable ? true : false;
  };

  return (
    <>
      <div className="x-margin">
        <InputWithIcon
          focusOnDidMount
          placeholder={Languages.t(
            'scenes.apps.messages.left_bar.stream_modal.placeholder_name',
            [],
            'Name',
          )}
          value={[icon, name]}
          onChange={(value: string[]) => setIcon(value[0])}
        >
          <InputWithSelect
            channel={channel}
            groups={getGroups()}
            onChange={(values: string[]) => {
              setGroup((values[0] || '').toLocaleUpperCase().trim());
              setName(values[1]);
            }}
          />
        </InputWithIcon>
      </div>
      <div style={{ padding: '16px 0' }} />
      <div className="x-margin">
        <Title level={5}>
          {Languages.t(
            'scenes.app.popup.appsparameters.pages.description_label',
            [],
            'Description',
          )}
        </Title>
        <TextArea
          size={'large'}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder={Languages.t('scenes.app.mainview.channel_description', [], 'Description')}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          rows={1}
        />
      </div>
      {isAbleToEditVisibilityOrDefault() && (
        <>
          <div style={{ padding: '16px 0' }} />
          <div className="x-margin">
            <Title level={5}>
              {Languages.t(
                'scenes.apps.calendar.event_edition.title_confidentiality',
                [],
                'Confidentiality',
              )}
            </Title>
            <Select
              size={'large'}
              value={visibility ? visibility : 'private'}
              onChange={(value: 'public' | 'direct' | 'private') => setVisibility(value)}
            >
              <Option value="private">
                {Languages.t('scenes.app.channelsbar.private_channel_label', [], 'Private channel')}
              </Option>
              <Option value="public">
                {Languages.t('scenes.app.channelsbar.public_channel_label', [], 'Public channel')}
              </Option>
            </Select>
          </div>
        </>
      )}
      {isAbleToEditVisibilityOrDefault() && (
        <div style={{ height: '32px' }} className="top-margin left-margin">
          {visibility === 'public' && (
            <Checkbox onChange={() => setDefaultChannel(!defaultChannel)} checked={defaultChannel}>
              {Languages.t('scenes.client.channelbar.channeltemplateeditor.checkbox')}
            </Checkbox>
          )}
        </div>
      )}
    </>
  );
};

export default ChannelTemplateEditor;
