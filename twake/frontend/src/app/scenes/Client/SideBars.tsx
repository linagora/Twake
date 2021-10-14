// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense } from 'react';
import { Layout } from 'antd';

import ChannelsBar from './ChannelsBar/ChannelsBar';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar';

export default () => {
  return (
    <Layout style={{ height: '100%', backgroundColor: 'var(--secondary)' }}>
      {
        // TODO Loading component
      }
      <Suspense fallback={<></>}>
        <WorkspacesBar key='workspacebar' />
      </Suspense>
      <ChannelsBar key='channelbar' />
    </Layout>
  );
};
