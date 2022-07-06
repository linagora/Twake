import React from 'react';
import { Col, Input, Row, Typography } from 'antd';
import Icon from 'app/components/icon/icon';
import { capitalize } from 'lodash';
import { ChannelType } from 'app/features/channels/types/channel';
import RouterServices from 'app/features/router/services/router-service';
import DepreciatedCollections from 'app/deprecated/CollectionsV1/Collections/Collections';
import Languages from 'app/features/global/services/languages-service';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import SearchInput from '../Search';
import MainViewService from 'app/features/router/services/main-view-service';
import { Calendar, CheckSquare, Folder } from 'react-feather';
import AvatarComponent from 'app/components/avatar/avatar';
import { Application } from 'app/features/applications/types/application';

export default (): JSX.Element => {
  const application = MainViewService.getConfiguration().app;
  if (!application) {
    return <></>;
  }

  const channel = {
    name: Languages.t(
      'app.identity?.name.' + application?.identity?.code,
      [],
      application.identity?.name,
    ),
  };
  const IconType = WorkspacesApps.getAppIcon(application, true);
  let icon: JSX.Element;
  if (typeof IconType === 'string') {
    icon = <Icon type={IconType} style={{ width: 16, height: 16 }} />;
  } else {
    icon = <IconType size={16} />;
  }

  const getDefaultApplicationIcon = (app: Partial<Application>) => {
    switch (app?.identity?.code) {
      case 'twake_tasks':
        return <CheckSquare size={16} color={'var(--black)'} />;
      case 'twake_calendar':
        return <Calendar size={16} color={'var(--black)'} />;
      case 'twake_drive':
        return <Folder size={16} color={'var(--black)'} />;

      default:
        return (
          <AvatarComponent
            url={app?.identity?.icon}
            fallback={`${process.env.PUBLIC_URL}/public/img/hexagon.png`}
            size={16}
          />
        );
    }
  };

  return (
    <div
      className="flex flex-nowrap items-center px-2 h-10"
      style={{ lineHeight: '47px', flexWrap: 'nowrap' }}
    >
      <Col flex="auto">
        <span className="ml-2 app-name" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="small-right-margin" style={{ lineHeight: 0, width: 16 }}>
            {getDefaultApplicationIcon(application)}
          </div>
          <Typography.Text className="small-right-margin" strong>
            {capitalize(channel.name)}
          </Typography.Text>
          <Typography.Text> </Typography.Text>
        </span>
      </Col>

      <SearchInput />
    </div>
  );
};
