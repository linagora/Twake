import React, { Suspense } from 'react';
import { ChannelType } from 'app/features/channels/types/channel';
import { ViewConfiguration } from 'app/features/router/services/app-view-service';
import NewThread from './input/new-thread';
import MessagesList from './messages-list';
import ThreadMessagesList from './thread-messages-list';
import IsWriting from './input/parts/IsWriting';

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
      </Suspense>
      <IsWriting channelId={channelId} threadId={threadId} />
      <NewThread
        collectionKey=""
        useButton={isDirectChannel && !threadId}
        channelId={channelId}
        threadId={threadId}
      />
    </div>
  );
};
