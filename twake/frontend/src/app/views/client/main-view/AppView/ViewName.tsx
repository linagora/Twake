import React, { FC } from 'react';
import AppViewService from 'app/features/router/services/app-view-service';
import Languages from 'services/languages/languages';
import { ChannelResource } from 'app/features/channels/types/channel';
import { useWorkspace } from 'app/features/workspaces/hooks/use-workspaces';

type PropsType = {
  id: string;
  viewService: AppViewService;
};

const ViewName: FC<PropsType> = props => {
  //Listen context and app_id changes
  props.viewService.useWatcher(() => [
    props.viewService.getConfiguration().app?.id,
    props.viewService.getConfiguration().context,
  ]);

  const configuration = props.viewService.getConfiguration();

  const channelCollection = configuration.collection;
  let channel = null;
  if (channelCollection?.findOne) {
    channel = channelCollection.findOne({ id: props.id });
  }

  const { workspace } = useWorkspace((channel as ChannelResource)?.data?.workspace_id || '');

  let text = '';
  if (channel && workspace) {
    text =
      (workspace ? workspace.name + ' • ' : '') + ((channel as ChannelResource).data.name || '');
  }

  return <span>{Languages.t('scenes.app.side_app.messages_thread_title', [text])}</span>;
};
export default ViewName;
