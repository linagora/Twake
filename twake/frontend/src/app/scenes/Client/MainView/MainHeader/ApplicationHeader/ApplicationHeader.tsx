import React from 'react';
import { Col, Input, Row, Typography } from 'antd';
import Icon from 'app/components/Icon/Icon';
import { capitalize } from 'lodash';
import { ChannelResource } from 'app/models/Channel';
import RouterServices from 'app/services/RouterService';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';
import Languages from 'services/languages/languages';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import SearchInput from '../Search';

export default (): JSX.Element => {
  const { channelId } = RouterServices.getStateFromRoute();

  const appChannel = DepreciatedCollections.get('channels').find(channelId);
  const application = DepreciatedCollections.get('applications').find(appChannel?.app_id);

  if (!application) {
    return <></>;
  }

  const channel = new ChannelResource({
    name: Languages.t('app.name.' + application.simple_name, [], application.name),
  });
  const IconType = WorkspacesApps.getAppIcon(application, true);
  let icon: JSX.Element;
  if (typeof IconType === 'string') {
    icon = <Icon type={IconType} style={{ width: 16, height: 16 }} />;
  } else {
    icon = <IconType size={16} />;
  }

  if (!appChannel) {
    return <></>;
  }

  return (
    <Row
      justify="space-between"
      align="middle"
      style={{ lineHeight: '47px', padding: 0, flexWrap: 'nowrap' }}
    >
      <Col flex="auto">
        <span className="left-margin" style={{ display: 'flex', alignItems: 'center' }}>
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
