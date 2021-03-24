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
  hideFooterDivider?: boolean;
  footerAlign?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | undefined;
  titleCenter?: boolean;
  style?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  titleLevel?: 5 | 1 | 2 | 3 | 4 | undefined;
  titleColor?: string;
};

const { Header, Content, Footer } = Layout;
const ObjectModal: FC<PropsType> = (props: PropsType) => {
  return (
    <Layout className="modal-layout" hasSider={false} style={props.style || {}}>
      <Header className="modal-layout-header" style={props.headerStyle || {}}>
        <Row justify="space-between" align="middle" className="modal-layout-row">
          {props.titleCenter && <Col style={{ width: 32 }}></Col>}
          {props.title && (
            <Col>
              <Typography.Title
                level={props.titleLevel || 5}
                style={{
                  margin: 0,
                  marginTop: props.titleCenter ? 8 : 0,
                  color: props.titleColor,
                }}
              >
                {props.title}
              </Typography.Title>
            </Col>
          )}
          {(props.closable === true && (
            <Col>
              <Icon
                type="times"
                className={`m-icon-small square-button ${
                  props.headerStyle?.backgroundColor ? 'red' : ''
                }`}
                onClick={() => ModalManager.closeAll()}
              />
            </Col>
          )) || <Col style={{ width: 32 }}></Col>}
        </Row>
      </Header>
      {props.children && <Content>{props.children}</Content>}
      {props.footer && (
        <Footer className="modal-layout-footer">
          {!props.hideFooterDivider && <Divider className="y-margin" />}
          <Row align="middle" justify={props.footerAlign || 'end'}>
            <Col
              style={{
                marginBottom: props.footerAlign === 'center' ? 54 : 16,
                marginRight: !props.footerAlign ? 16 : 0,
              }}
            >
              {props.footer}
            </Col>
          </Row>
        </Footer>
      )}
    </Layout>
  );
};

export default ObjectModal;
