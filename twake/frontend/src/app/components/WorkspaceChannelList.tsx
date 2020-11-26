import React, { useState } from 'react';

import { Divider, Input, Row, Typography } from 'antd';
import Languages from 'services/languages/languages.js';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import Icon from 'components/Icon/Icon';
import RouterServices from 'app/services/RouterServices';
import { Collection } from 'services/CollectionsReact/Collections';
import { ChannelResource } from 'app/models/Channel';
import WorkspaceChannelRow from 'scenes/Client/ChannelsBar/WorkspaceChannelList/WorkspaceChannelRow';
import PerfectScrollbar from 'react-perfect-scrollbar';

export default () => {
  const [loadedChannels, setLoadedChannels] = useState<number>(3);
  const { companyId, workspaceId } = RouterServices.useStateFromRoute();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
  const channelsCollection = Collection.get(collectionPath, ChannelResource);
  const channels = channelsCollection.useWatcher({}, { limit: loadedChannels });

  return (
    <ObjectModal title={Languages.t('components.channelworkspacelist.title')} closable>
      <Row className="small-bottom-margin x-margin">
        <Input
          suffix={
            <Icon type="search" className="m-icon-small" style={{ color: 'var(--grey-dark)' }} />
          }
          autoFocus
          placeholder={Languages.t('scenes.client.channelbar.workspacechannellist.autocomplete')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => console.log(channels)}
        />
      </Row>

      <PerfectScrollbar
        style={{ maxHeight: '250px' }}
        component="div"
        options={{ suppressScrollX: true, suppressScrollY: false }}
      >
        {channels &&
          channels.map((channel: ChannelResource, index: number) => {
            return (
              <div key={`${channel.data.id}_${index}`}>
                <WorkspaceChannelRow channel={channel} />
                <Divider style={{ margin: 0 }} />
              </div>
            );
          })}
        <Row align="middle" justify="center" className="y-margin">
          <Typography.Link
            style={{ color: 'var(--grey-dark)' }}
            onClick={() => setLoadedChannels(loadedChannels + 3)}
          >
            {Languages.t('scenes.client.channelbar.channelmemberslist.loader')}
          </Typography.Link>
        </Row>
      </PerfectScrollbar>
    </ObjectModal>
  );
};
