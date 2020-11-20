import React, { FC, useState, useEffect } from 'react';

import { Layout } from 'antd';
import Tabs from './MainHeader/Tabs/Tabs';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
type PropsType = {
  classname?: string;
};

type TabsType = {
  application_id?: string;
  name?: string;
  icon?: string | JSX.Element;
  children?: JSX.Element;
  button?: boolean;
};

const MainContent: FC<PropsType> = props => {
  const [tabsList, setTabsList] = useState<TabsType[]>([]);

  useEffect(() => {
    generateTabsList();
  }, []);

  // To do use this for select
  const generateTabsList = () => {
    const apps = WorkspacesApps.getApps();
    console.log(apps);
    let list: TabsType[] = [];
    apps.map((app: any) => list.push({ name: app.name, icon: WorkspacesApps.getAppIcon(app) }));
    return setTabsList(list);
  };

  // TODO use new collections for adding tabs
  // TODO use old collections for apps

  const onChangeTabs = (array: TabsType[], entry: TabsType) => {
    const newList = [...array, entry];
    //return setTabsList(newList);
  };

  return (
    <Layout.Content className={props.classname}>
      <Tabs tabs={tabsList} onChangeTabs={(newTab: TabsType) => onChangeTabs(tabsList, newTab)} />
    </Layout.Content>
  );
};

export default MainContent;
