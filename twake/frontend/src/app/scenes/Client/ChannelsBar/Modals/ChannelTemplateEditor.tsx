import React, { FC, useState, useEffect } from 'react';
import Languages from 'services/languages/languages.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import { ChannelType } from 'app/models/Channel';
import { Select, Typography, Divider, Checkbox, Input } from 'antd';

type Props = {
  channel: ChannelType | undefined;
  onChange: (channelEntries: any) => void;
  isCurrentUserAdmin?: boolean;
  currentUserId?: string;
};

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const ChannelTemplateEditor: FC<Props> = ({
  channel,
  onChange,
  isCurrentUserAdmin,
  currentUserId,
}) => {
  const [icon, setIcon] = useState<string>(channel?.icon || '');
  const [name, setName] = useState<string>(channel?.name || '');
  const [description, setDescription] = useState<string>(channel?.description || '');
  const [visibility, setVisibility] = useState<string>(channel?.visibility || 'public');
  const [defaultChannel, setDefaultChannel] = useState<boolean>(false);

  useEffect(() => {
    onChange({
      icon,
      name,
      description,
      visibility,
      default: defaultChannel,
    });
  });

  const isAbleToEditVisibility = () => {
    const isNewChannel = !channel;
    const editable =
      (channel && channel.id && (isCurrentUserAdmin === true || currentUserId === channel.owner)) ||
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
          onChange={(value: any[]) => {
            setIcon(value[0]);
            setName(value[1]);
          }}
        />
      </div>
      <Divider />
      <div className="x-margin">
        <Title level={5}>
          {Languages.t('scenes.app.popup.appsparameters.pages.description_label', 'Description')}
        </Title>
        <TextArea
          size={'large'}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder={Languages.t('scenes.app.mainview.channel_description', 'Description')}
          value={description}
          onChange={(e: any) => {
            setDescription(e.target.value);
          }}
          rows={1}
        />
      </div>
      {isAbleToEditVisibility() === true && (
        <>
          <Divider />
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
              onChange={(value: any) => {
                setVisibility(value);
              }}
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
      {false && (
        <div style={{ height: '32px' }} className="top-margin left-margin">
          {visibility === 'public' && (
            <Checkbox onChange={() => setDefaultChannel(!defaultChannel)}>
              {Languages.t('scenes.client.channelbar.channeltemplateeditor.checkbox')}
            </Checkbox>
          )}
        </div>
      )}
    </>
  );
};

export default ChannelTemplateEditor;
