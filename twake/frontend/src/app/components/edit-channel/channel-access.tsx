import { Button } from 'app/atoms/button/button';
import { BaseSmall, Info, Subtitle } from 'app/atoms/text';
import Switch from 'app/components/inputs/switch';
import { ChannelType } from 'app/features/channels/types/channel';
import Block from 'app/molecules/grouped-rows/base';
import { useState } from 'react';

export const ChannelAccessForm = (props: {
  channel?: ChannelType;
  onChange: (change: {
    visibility: 'private' | 'public';
    is_default: boolean;
    is_readonly: boolean;
  }) => void;
}) => {
  const [visibility, setVisibility] = useState<'private' | 'public'>(
    props.channel?.visibility || ('private' as any),
  );
  const [isDefault, setIsDefault] = useState(props.channel?.is_default || false);
  const [isReadOnly, setIsReadOnly] = useState(props.channel?.is_readonly || false);

  return (
    <div className="w-screen max-w-xs">
      <Block
        className="my-4"
        avatar={<></>}
        title={'Public channel'}
        subtitle={
          <BaseSmall className="whitespace-normal leading-3">
            Anyone except company guests can join.
          </BaseSmall>
        }
        suffix={
          <Switch
            checked={visibility === 'public'}
            onChange={() => {
              if (visibility === 'public') setIsDefault(false);
              setVisibility(visibility === 'public' ? 'private' : 'public');
            }}
          />
        }
      />

      <Block
        className="my-4"
        avatar={<></>}
        title={'Default channel'}
        subtitle={
          <BaseSmall className="whitespace-normal leading-3">
            New members will be added here automatically.
          </BaseSmall>
        }
        suffix={
          <Switch
            checked={isDefault}
            onChange={() => {
              setIsDefault(!isDefault);
              if (visibility === 'private' && !isDefault) setVisibility('public');
            }}
          />
        }
      />

      <Block
        className="my-4"
        avatar={<></>}
        title={'Read-only channel'}
        subtitle={
          <BaseSmall className="whitespace-normal leading-3">
            Restrict write to moderators, admins and owners.
          </BaseSmall>
        }
        suffix={
          <Switch
            checked={isReadOnly}
            onChange={() => {
              setIsReadOnly(!isReadOnly);
            }}
          />
        }
      />

      <div className="text-center mt-4">
        <Button
          theme="primary"
          onClick={() => {
            props.onChange({ visibility, is_default: isDefault, is_readonly: isReadOnly });
          }}
        >
          Save access settings
        </Button>
      </div>
    </div>
  );
};
