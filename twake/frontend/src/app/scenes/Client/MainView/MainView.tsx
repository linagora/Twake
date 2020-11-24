import React, { FC, useState, useEffect } from 'react';
import RouterServices from 'services/RouterServices';
import Collections, { Collection, Resource } from 'services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';

import { Layout } from 'antd';
import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';

import './MainView.scss';

const MainView: FC = () => {
  const [channel, setChannel] = useState<ChannelResource>();
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();
  const path: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
  const channelsCollection = Collections.get(path, ChannelResource);

  useEffect(() => {
    getChannel();
  });

  const getChannel = async () => {
    const foundChannel = await channelsCollection.findOne({
      id: channelId,
    });
    return setChannel(foundChannel);
  };
  return (
    <Layout className="main-view-layout">
      <MainHeader
        classname="main-view-header"
        channelId={channel?.id || ''}
        channelIcon={channel?.data.icon}
        channelName={channel?.data.name}
        channelDescription={channel?.data.description}
      />
      <MainContent classname="main-view-content" />
    </Layout>
  );
};

export default MainView;
