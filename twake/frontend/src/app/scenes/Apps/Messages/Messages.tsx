import React, { Suspense } from 'react';
import { ChannelResource } from 'app/models/Channel';
import { ViewConfiguration } from 'app/services/AppView/AppViewService';
import NewThread from './Input/NewThread';
import ThreadsList from './ThreadsList';
import ThreadMessagesList from './ThreadMessagesList';

type Props = {
  channel: ChannelResource;
  tab?: any;
  options: ViewConfiguration;
};

export default (props: Props) => {
  const companyId = props.channel.data.company_id || '';
  const workspaceId = props.channel.data.workspace_id || '';
  const channelId = props.channel.data.id || '';
  const isDirectChannel = props.channel.data.visibility !== 'direct';
  const threadId = props.options.context?.threadId || '';

  return (
    <div>
      <Suspense fallback="loading...">
        {!threadId && (
          <ThreadsList companyId={companyId} workspaceId={workspaceId} channelId={channelId} />
        )}
        {!!threadId && <ThreadMessagesList threadId={threadId} companyId={companyId} />}
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
