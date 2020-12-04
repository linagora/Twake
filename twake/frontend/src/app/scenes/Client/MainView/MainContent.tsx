import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';
import AppView from './AppView/AppView';
import SideViewService from 'app/services/AppView/SideViewService';
import MainViewService from 'app/services/AppView/MainViewService';
import NoApp from './NoApp';

const MainContent: FC<{}> = () => {
  const [mainType, mainId] = MainViewService.useWatcher(() => [
    MainViewService.getViewType(),
    MainViewService.getId(),
  ]);
  const mainConfiguration = MainViewService.getConfiguration();
  const [sideType, sideId] = SideViewService.useWatcher(() => [
    SideViewService.getViewType(),
    SideViewService.getId(),
  ]);
  const sideConfiguration = SideViewService.getConfiguration();

  return (
    <Layout.Content className={'global-view-content'}>
      <Layout style={{ height: '100%' }}>
        <Layout.Content>
          <Layout className="main-view-layout">
            {mainConfiguration.hasTabs && (
              <Layout.Header className="main-view-tabs-header">
                <Tabs key={mainId} />
              </Layout.Header>
            )}
            <Layout.Content className="main-view-content">
              {mainType !== '' && (
                <AppView
                  key={mainId}
                  id={mainId}
                  app={mainConfiguration.app}
                  configuration={mainConfiguration}
                />
              )}
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
          {sideType !== '' && (
            <AppView
              key={sideId + '-side'}
              id={sideId}
              app={mainConfiguration.app}
              configuration={sideConfiguration}
            />
          )}
        </Layout.Sider>
      </Layout>
    </Layout.Content>
  );
};

export default MainContent;
