import { Col, Input } from 'antd';
import React from 'react';
import { Search } from 'react-feather';

export default (props: {}): JSX.Element => {
  return (
    <Col flex="none" style={{ width: 200 }}>
      <Input
        width={200}
        suffix={<Search size={16} style={{ color: 'var(--grey-dark)' }} />}
        placeholder={'Search'}
      />
    </Col>
  );
};
