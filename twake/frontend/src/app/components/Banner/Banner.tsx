import React from 'react';
import { Col, Layout, Row } from 'antd';
import './Banner.scss';
import { X } from 'react-feather';

type PropsType = {
  closable?: boolean;
  content: string | JSX.Element;
  onClose?: () => any;
  height?: string | number;
  type: 'primary' | 'secondary' | 'default' | 'warning' | 'important';
};

const Banner = ({ closable, content, onClose, height, type }: PropsType) => {
  const headerStyle = {
    height: height ? height : 60,
    lineHeight: height ? `${height}px` : '60px',
  };

  return (
    <Layout.Header className={`banner-container ${type}`} style={headerStyle}>
      <Row align="middle" justify="space-between" gutter={[0, 0]}>
        <Col /* ghost column */></Col>
        <Col>{content}</Col>
        <Col className="banner-col-icon">
          {closable && <X size={16} className="icon" onClick={onClose} />}
        </Col>
      </Row>
    </Layout.Header>
  );
};

export default Banner;
