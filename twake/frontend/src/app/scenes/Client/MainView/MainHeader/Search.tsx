import { Button, Col, Input, Row } from 'antd';
import React from 'react';
import { Search } from 'react-feather';
import SearchService from 'services/search/search.js';
import RouterServices from 'services/RouterService';
import AccessRightsService from 'app/services/AccessRightsService';

export default (): JSX.Element => {
  const { workspaceId } = RouterServices.useRouteState(({ workspaceId }) => {
    return { workspaceId };
  });

  if (!AccessRightsService.hasLevel(workspaceId || '', 'member')) {
    return <></>;
  }

  return (
    <>
      <Col xs={0} sm={0} md={0} lg={6} xl={5} xxl={4}>
        <Row justify="center">
          <Col flex="none" style={{ width: 200 }}>
            <Input
              width={200}
              maxLength={0}
              suffix={<Search size={16} style={{ color: 'var(--grey-dark)' }} />}
              placeholder={'Search'}
              onClick={() => SearchService.open()}
            />
          </Col>
        </Row>
      </Col>

      <Col xs={1} sm={1} md={1} lg={0} xl={0} xxl={0}>
        <Button
          type="default"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'start' }}
          icon={<Search size={16} />}
          onClick={() => {
            SearchService.open();
          }}
        />
      </Col>
    </>
  );
};
