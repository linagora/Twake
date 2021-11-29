import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';
import AppView from './AppView/AppView';
import SideViewService from 'app/services/AppView/SideViewService';
import MainViewService from 'app/services/AppView/MainViewService';
import { X } from 'react-feather';
import ViewName from './AppView/ViewName';

export const ViewContext = React.createContext({ type: '', id: '' });

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

  // Put the sideview in full screen if screen has not a big width
  const { innerWidth } = window;
  let sideViewWidth = '40%';
  if (innerWidth < 768) {
    sideViewWidth = '100%';
  }
  return (
    <ViewContext.Provider value={{ type: 'main', id: mainId }}>
      <Layout.Content className={'global-view-content'}>
        <Layout style={{ flex: '1' }}>
          {mainConfiguration.hasTabs && (
            <Layout.Header className="main-view-tabs-header">
              <Tabs key={mainId} />
            </Layout.Header>
          )}
          <Layout style={{ height: '100%' }} hasSider>
            <Layout.Content>
              <Layout className="main-view-layout">
                <Layout.Content className="main-view-content">
                  <AppView key={mainId} id={mainId} viewService={MainViewService} />
                </Layout.Content>
              </Layout>
            </Layout.Content>
            <ViewContext.Provider value={{ type: 'side', id: sideId }}>
              <Layout.Sider
                trigger={null}
                className="global-side-view"
                breakpoint="lg"
                collapsedWidth="0"
                theme="light"
                width={sideViewWidth}
                collapsed={sideType === ''}
              >
                {!!sideType && (
                  <Layout style={{ height: '100%' }}>
                    <Layout.Header className="side-header">
                      <ViewName
                        key={sideId + '-side-header'}
                        id={sideId}
                        viewService={SideViewService}
                      />
                      <X onClick={() => SideViewService.select('', { context: {} })} />
                    </Layout.Header>
                    <Layout.Content style={{ flex: 1 }}>
                      <AppView key={sideId + '-side'} id={sideId} viewService={SideViewService} />
                    </Layout.Content>
                  </Layout>
                )}
              </Layout.Sider>
            </ViewContext.Provider>
          </Layout>
        </Layout>
      </Layout.Content>
    </ViewContext.Provider>
  );
};

export default MainContent;
