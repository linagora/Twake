import React, { FC } from 'react';

import { Layout } from 'antd';
import Tabs from './Tabs/Tabs';

type PropsType = {
  classname?: string;
};

const MainContent: FC<PropsType> = props => {
  return (
    <Layout.Content className={props.classname}>
      <Tabs />
    </Layout.Content>
  );
};

export default MainContent;
