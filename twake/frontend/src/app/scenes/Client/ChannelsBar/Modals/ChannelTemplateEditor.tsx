import React, { FC, useState, useEffect } from 'react';
import Languages from 'services/languages/languages.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import { Select, Typography, Checkbox, Input } from 'antd';
import InputWithSelect from 'app/components/Inputs/InputWithSelect';
import { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'app/services/RouterService';
import AccessRightsService from 'app/services/AccessRightsService';

type Props = {
  channel: ChannelType | undefined;
  onChange: (channelEntries: any) => void;
  currentUserId?: string;
};

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const ChannelTemplateEditor: FC<Props> = ({ channel, onChange, currentUserId }) => {
  const [icon, setIcon] = useState<string>(channel?.icon || '');
  const [name, setName] = useState<string>(channel?.name || '');
  const [description, setDescription] = useState<string>(channel?.description || '');
  const [visibility, setVisibility] = useState<string>(channel?.visibility || 'public');
  const [defaultChannel, setDefaultChannel] = useState<boolean>(channel?.is_default || false);
  const [group, setGroup] = useState<string>(channel?.channel_group || '');
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();

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
    const url: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
    const channelsCollection = Collection.get(url, ChannelResource);
    const channels = channelsCollection.find({}, { withoutBackend: true });

    const groupsNames: string[] = [];
    channels
      .sort((a, b) => (a.data.channel_group || '').localeCompare(b.data.channel_group || ''))
      .forEach((channel: ChannelResource) => {
        if (channel.data.channel_group && !groupsNames.includes(channel.data.channel_group))
          groupsNames.push(channel.data.channel_group);
      });
    return groupsNames;
  };

  const isAbleToEditVisibilityOrDefault = () => {
    const isNewChannel = !channel;
    const editable =
      (channel &&
        channel.id &&
        (AccessRightsService.hasLevel(workspaceId || '', 'administrator') ||
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
          {Languages.t('scenes.app.popup.appsparameters.pages.description_label', 'Description')}
        </Title>
        <TextArea
          size={'large'}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder={Languages.t('scenes.app.mainview.channel_description', 'Description')}
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
                'Confidentiality',
              )}
            </Title>
            <Select
              size={'large'}
              value={visibility ? visibility : 'private'}
              onChange={(value: string) => setVisibility(value)}
            >
              <Option value="private">
                {Languages.t('scenes.app.channelsbar.private_channel_label', 'Private channel')}
              </Option>
              <Option value="public">
                {Languages.t('scenes.app.channelsbar.public_channel_label', 'Public channel')}
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
