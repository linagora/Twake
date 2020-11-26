import { Col, Input } from 'antd';
import React from 'react';
import { Search } from 'react-feather';
import SearchService from 'services/search/search.js';

export default (props: {}): JSX.Element => {
  return (
    <Col flex="none" style={{ width: 200 }}>
      <Input
        width={200}
        maxLength={0}
        suffix={<Search size={16} style={{ color: 'var(--grey-dark)' }} />}
        placeholder={'Search'}
        onClick={() => SearchService.open()}
      />
    </Col>
  );
};
