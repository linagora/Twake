import React, { FC, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Languages from 'services/languages/languages.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import Select from 'components/Select/Select.js';
import { ChannelType } from 'app/models/Channel';
import {
  ObjectModalSeparator,
  ObjectModalSectionTitle,
} from 'components/ObjectModal/ObjectModal.js';

type Props = {
  channel: ChannelType | undefined;
  onChange: (channelEntries: any) => void;
};

const ChannelTemplateEditor: FC<Props> = ({ channel, onChange }) => {
  const [icon, setIcon] = useState<string>(channel?.icon || '');
  const [name, setName] = useState<string>(channel?.name || '');
  const [description, setDescription] = useState<string>(channel?.description || '');
  const [visibility, setVisibility] = useState<string>(channel?.visibility || 'private');

  useEffect(() => {
    onChange({
      icon,
      name,
      description,
      visibility,
    });
  }, [icon, name, description, visibility]);

  return (
    <div>
      {
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
      }
      <div style={{ marginBottom: '8px' }}>
        <ObjectModalSeparator />
        <ObjectModalSectionTitle
          title={Languages.t(
            'scenes.app.popup.appsparameters.pages.description_label',
            'Description',
          )}
          smallMargin
        />
        <AutoHeight
          minHeight="40px"
          maxHeight="150px"
          placeholder={Languages.t('scenes.app.mainview.channel_description', 'Description')}
          value={description}
          onChange={(e: any) => {
            setDescription(e.target.value);
          }}
        />
        <ObjectModalSeparator />
        <ObjectModalSectionTitle
          title={Languages.t(
            'scenes.apps.calendar.event_edition.title_participants',
            'Participants',
          )}
          action={
            <Select
              value={visibility}
              style={{ width: 'auto' }}
              onChange={(value: any) => {
                console.log(value);
                setVisibility(value);
              }}
              options={[
                {
                  value: 'public',
                  text: Languages.t(
                    'scenes.app.channelsbar.public_channel_label',
                    'Public channel',
                  ),
                },
                {
                  value: 'private',
                  text: Languages.t(
                    'scenes.app.channelsbar.private_channel_label',
                    'Private channel',
                  ),
                },
              ]}
            />
          }
        />
      </div>
    </div>
  );
};

export default ChannelTemplateEditor;
