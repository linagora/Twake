import React, { Suspense } from 'react';
import { ChannelResource } from 'app/models/Channel';
import { ViewConfiguration } from 'app/services/AppView/AppViewService';
import NewThread from './Input/NewThread';
import MessagesList from './MessagesList';
import ThreadMessagesList from './ThreadMessagesList';

type Props = {
  channel: ChannelResource;
  tab?: any;
  options: ViewConfiguration;
};

export default (props: Props) => {
  if (!props.channel) {
    return <></>;
  }

  const companyId = props.channel.data.company_id || '';
  const workspaceId = props.channel.data.workspace_id || '';
  const channelId = props.channel.data.id || '';
  const isDirectChannel = props.channel.data.visibility !== 'direct';
  const threadId = props.options.context?.threadId || '';

  return (
    <div className="messages-view">
      <Suspense fallback="loading...">
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
      <NewThread
        collectionKey=""
        useButton={isDirectChannel && !threadId}
        channelId={channelId}
        threadId={threadId}
      />
    </div>
  );
};
