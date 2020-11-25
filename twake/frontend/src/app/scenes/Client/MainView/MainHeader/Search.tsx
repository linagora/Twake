import { Col, Input } from 'antd';
import Icon from 'app/components/Icon/Icon';
import React from 'react';

export default (props: {}): JSX.Element => {
  return (
    <Col>
      <Input
        size={'small'}
        prefix={
          <Icon type="search" className="m-icon-small" style={{ color: 'var(--grey-dark)' }} />
        }
        placeholder={'search'}
      />
    </Col>
  );
};
