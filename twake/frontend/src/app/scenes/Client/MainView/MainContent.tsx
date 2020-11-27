import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';
import AppView from './AppView';

const MainContent: FC<{}> = () => {
  return (
    <Layout.Content className={'main-view-content'}>
      <Layout style={{ height: '100%' }}>
        <Layout.Content>
          <Layout>
            <Layout.Header className="main-view-tabs-header">
              <Tabs />
            </Layout.Header>
            <Layout.Content>
              <AppView />
            </Layout.Content>
          </Layout>
        </Layout.Content>
        <Layout.Sider
          className="main-view-thread"
          breakpoint="lg"
          collapsedWidth="0"
          theme="light"
          width="40%"
        >
          <AppView />
        </Layout.Sider>
      </Layout>
    </Layout.Content>
  );
};

export default MainContent;
