import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';

type PropsType = {
  classname?: string;
};

const MainContent: FC<PropsType> = props => {
  return (
    <Layout.Content className={props.classname}>
      <Layout style={{ height: '100%' }}>
        <Layout.Content>
          <Layout>
            <Layout.Header>
              {' '}
              <Tabs />
            </Layout.Header>
          </Layout>
        </Layout.Content>
        <Layout.Sider
          className="main-view-thread"
          breakpoint="lg"
          collapsedWidth="0"
          theme="light"
          width="40%"
        >
          Thread or pinned
        </Layout.Sider>
      </Layout>
    </Layout.Content>
  );
};

export default MainContent;
