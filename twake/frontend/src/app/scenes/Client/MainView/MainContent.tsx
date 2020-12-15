import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';
import AppView from './AppView/AppView';
import SideViewService from 'app/services/AppView/SideViewService';
import MainViewService from 'app/services/AppView/MainViewService';
import NoApp from './NoApp';
import { X } from 'react-feather';
import Languages from 'services/languages/languages.js';

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
                <AppView key={mainId} id={mainId} viewService={MainViewService} />
              )}
              {mainType == '' && <NoApp />}
            </Layout.Content>
          </Layout>
        </Layout.Content>
        <Layout.Sider
          className="global-side-view"
          breakpoint="lg"
          collapsedWidth="0"
          theme="light"
          width="40%"
          collapsed={sideType === ''}
        >
          <div className="side-header">
            <span>
              {Languages.t('scenes.app.side_app.messages_thread_title', ['Software • FT - Twake'])}
            </span>
            <X onClick={() => SideViewService.select('', { context: {} })} />
          </div>
          {sideType !== '' && (
            <AppView key={sideId + '-side'} id={sideId} viewService={SideViewService} />
          )}
        </Layout.Sider>
      </Layout>
    </Layout.Content>
  );
};

export default MainContent;
