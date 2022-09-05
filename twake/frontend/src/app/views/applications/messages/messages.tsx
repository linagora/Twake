import React, { Suspense, useState } from 'react';
import { ChannelType } from 'app/features/channels/types/channel';
import { ViewConfiguration } from 'app/features/router/services/app-view-service';
import NewThread from './input/new-thread';
import MessagesList from './messages-list';
import ThreadMessagesList from './thread-messages-list';
import IsWriting from './input/parts/IsWriting';
import { useChannel, useIsChannelMember } from 'app/features/channels/hooks/use-channel';
import { Button } from 'app/atoms/button/button';
import ChannelsReachableAPIClient from 'app/features/channels/api/channels-reachable-api-client';
import UserService from 'app/features/users/services/current-user-service';
import * as Text from '@atoms/text';
import Languages from 'app/features/global/services/languages-service';
import MessageSeenBy from 'app/components/message-seen-by/message-seen-by';

type Props = {
  channel: ChannelType;
  tab?: any;
  options: ViewConfiguration;
};

export default (props: Props) => {
  if (!props.channel) {
    return <></>;
  }

  const companyId = props.channel.company_id || '';
  const workspaceId = props.channel.workspace_id || '';
  const channelId = props.channel.id || '';
  const isDirectChannel = props.channel.visibility !== 'direct';
  const threadId = props.options.context?.threadId || '';

  const isChannelMember = useIsChannelMember(channelId);

  return (
    <div className="messages-view">
      <Suspense fallback={<></>}>
        {!threadId ? (
          <MessagesList
            key={channelId + threadId}
            companyId={companyId}
            workspaceId={workspaceId}
            channelId={channelId}
            threadId={threadId}
          />
        ) : (
          <ThreadMessagesList
            key={channelId + threadId}
            companyId={companyId}
            workspaceId={workspaceId}
            channelId={channelId}
            threadId={threadId}
          />
        )}{' '}
      <MessageSeenBy />
      </Suspense>
      <IsWriting channelId={channelId} threadId={threadId} />
      {isChannelMember && (
        <NewThread
          collectionKey=""
          useButton={isDirectChannel && !threadId}
          channelId={channelId}
          threadId={threadId}
        />
      )}
      {!isChannelMember && <JoinChanneBlock channelId={channelId} />}
    </div>
  );
};

const JoinChanneBlock = ({ channelId }: { channelId: string }) => {
  const [loading, setLoading] = useState(false);
  const { channel, refresh } = useChannel(channelId);

  if (!channel) {
    return <></>;
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 p-8 text-center">
      <Button
        loading={loading}
        onClick={async () => {
          setLoading(true);
          await ChannelsReachableAPIClient.inviteUser(
            channel.company_id || '',
            channel.workspace_id || '',
            channel.id || '',
            UserService.getCurrentUserId(),
          );
          refresh();
          setLoading(false);
        }}
        className="mb-4"
      >
        {Languages.t('scenes.client.join_public_channel')}
      </Button>
      <br />
      <Text.Info>{Languages.t('scenes.client.join_public_channel.info')}</Text.Info>
    </div>
  );
};
