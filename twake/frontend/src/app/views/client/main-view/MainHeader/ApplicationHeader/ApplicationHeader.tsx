import React from 'react';
import { Col, Input, Row, Typography } from 'antd';
import Icon from 'app/components/icon/icon';
import { capitalize } from 'lodash';
import { ChannelResource } from 'app/features/channels/types/channel';
import RouterServices from 'app/features/router/services/router-service';
import DepreciatedCollections from 'app/deprecated/CollectionsV1/Collections/Collections';
import Languages from 'services/languages/languages';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import SearchInput from '../Search';
import MainViewService from 'app/features/router/services/main-view-service';

export default (): JSX.Element => {
  const application = MainViewService.getConfiguration().app;
  if (!application) {
    return <></>;
  }

  const channel = new ChannelResource({
    name: Languages.t(
      'app.identity?.name.' + application?.identity?.code,
      [],
      application.identity?.name,
    ),
  });
  const IconType = WorkspacesApps.getAppIcon(application, true);
  let icon: JSX.Element;
  if (typeof IconType === 'string') {
    icon = <Icon type={IconType} style={{ width: 16, height: 16 }} />;
  } else {
    icon = <IconType size={16} />;
  }

  return (
    <Row
      justify="space-between"
      align="middle"
      style={{ lineHeight: '47px', padding: 0, flexWrap: 'nowrap' }}
    >
      <Col flex="auto">
        <span className="left-margin app-name" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="small-right-margin" style={{ lineHeight: 0, width: 16 }}>
            {icon}
          </div>
          <Typography.Text className="small-right-margin" strong>
            {capitalize(channel.data.name)}
          </Typography.Text>
          <Typography.Text>{' ' + (channel.data.description || '')}</Typography.Text>
        </span>
      </Col>

      <SearchInput />
    </Row>
  );
};
