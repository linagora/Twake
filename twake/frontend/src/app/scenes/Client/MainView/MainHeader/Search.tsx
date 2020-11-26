import { Col, Input } from 'antd';
import Icon from 'app/components/Icon/Icon';
import React from 'react';

export default (props: {}): JSX.Element => {
  return (
    <Col flex="none" style={{ width: 200 }}>
      <Input
        width={200}
        size={'small'}
        prefix={
          <Icon type="search" className="m-icon-small" style={{ color: 'var(--grey-dark)' }} />
        }
        placeholder={'search'}
      />
    </Col>
  );
};
