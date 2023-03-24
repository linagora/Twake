import React, { FC } from 'react';
import AppViewService from 'app/features/router/services/app-view-service';
import Languages from 'app/features/global/services/languages-service';
import { useWorkspace } from 'app/features/workspaces/hooks/use-workspaces';
import { useChannel } from 'app/features/channels/hooks/use-channel';

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

  const { channel } = useChannel(props.id);

  const { workspace } = useWorkspace(channel?.workspace_id || '');

  let text = '';
  if (channel && workspace) {
    text = (workspace ? workspace.name + ' • ' : '') + (channel.name || '');
  }

  return <span>{Languages.t('scenes.app.side_app.messages_thread_title', [text])}</span>;
};
export default ViewName;
