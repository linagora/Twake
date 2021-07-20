import React, { FC } from 'react';
import AppViewService from 'app/services/AppView/AppViewService';
import Languages from 'services/languages/languages';
import { ChannelResource } from 'app/models/Channel';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';

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

  let text = '';
  if (channel) {
    const workspace = DepreciatedCollections.get('workspaces').find(
      (channel as ChannelResource).data.workspace_id,
    );
    text =
      (workspace ? workspace.name + ' • ' : '') + ((channel as ChannelResource).data.name || '');
  }

  return <span>{Languages.t('scenes.app.side_app.messages_thread_title', [text])}</span>;
};
export default ViewName;
