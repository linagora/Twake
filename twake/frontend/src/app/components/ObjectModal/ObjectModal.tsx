import React, { FC } from 'react';
import { Divider, Layout, Typography, Col, Row } from 'antd';
import ModalManager from 'app/components/Modal/ModalManager';
import Icon from 'components/Icon/Icon.js';
import './ObjectModal.scss';

type PropsType = {
  title?: string | JSX.Element;
  closable?: boolean;
  children?: React.Component | JSX.Element | any;
  footer?: React.Component | JSX.Element | any;
};

const { Header, Content, Footer } = Layout;
const ObjectModal: FC<PropsType> = (props: PropsType) => {
  return (
    <Layout className="modal-layout" hasSider={false}>
      <Header className="modal-layout-header">
        <Row align="middle" justify="space-between" className="modal-layout-row">
          {props.title && (
            <Col>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {props.title}
              </Typography.Title>
            </Col>
          )}
          {props.closable === true && (
            <Col>
              <Icon
                type="times"
                className="m-icon-small square-button"
                onClick={() => ModalManager.closeAll()}
              />
            </Col>
          )}
        </Row>
      </Header>
      {props.children && <Content>{props.children}</Content>}
      {props.footer && (
        <Footer className="modal-layout-footer">
          <Divider className="y-margin" />
          <Row align="middle" justify="end" className="modal-layout-row">
            <Col className="bottom-margin right-margin">{props.footer}</Col>
          </Row>
        </Footer>
      )}
    </Layout>
  );
};

export default ObjectModal;
