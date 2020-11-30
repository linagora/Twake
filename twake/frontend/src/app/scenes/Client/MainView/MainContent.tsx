import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';
import AppView from './AppView';
import SideViewService from 'app/services/AppView/SideViewService';
import NoApp from './NoApp';

const MainContent: FC<{}> = () => {
  const sideType = SideViewService.useWatcher(() => SideViewService.getViewType());
  const mainType = SideViewService.useWatcher(() => SideViewService.getViewType());

  return (
    <Layout.Content className={'global-view-content'}>
      <Layout style={{ height: '100%' }}>
        <Layout.Content>
          <Layout className="main-view-layout">
            <Layout.Header className="main-view-tabs-header">
              <Tabs />
            </Layout.Header>
            <Layout.Content className="main-view-content">
              {mainType !== '' && <AppView />}
              {mainType == '' && <NoApp />}
            </Layout.Content>
          </Layout>
        </Layout.Content>
        <Layout.Sider
          className="global-view-thread"
          breakpoint="lg"
          collapsedWidth="0"
          theme="light"
          width="40%"
          collapsed={sideType === ''}
        >
          {sideType !== '' && <AppView />}
        </Layout.Sider>
      </Layout>
    </Layout.Content>
  );
};

export default MainContent;
