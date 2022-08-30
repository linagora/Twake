import React from 'react';
import { Col, Typography } from 'antd';
import { capitalize } from 'lodash';
import Languages from 'app/features/global/services/languages-service';
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
