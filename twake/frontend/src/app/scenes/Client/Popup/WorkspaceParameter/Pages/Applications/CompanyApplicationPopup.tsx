import React from 'react';

import moment from 'moment';
import { Check } from 'react-feather';
import { Tabs, Button, Typography, Col, Tag, Descriptions, Row, Divider } from 'antd';

import { Application } from 'app/models/App';
//import Languages from 'services/languages/languages';
import AvatarComponent from 'app/components/Avatar/Avatar';
import ObjectModal from 'app/components/ObjectModal/ObjectModal';
import ModalManager from 'app/components/Modal/ModalManager';
import { useCurrentCompanyApplications } from 'app/state/recoil/hooks/useCurrentCompanyApplications';

import './ApplicationsStyles.scss';

type PropsType = {
  application: Application;
  companyId: string;
  shouldDisplayButton?: boolean;
};

const { TabPane } = Tabs;
const { Text, Link, Title } = Typography;
const { Item } = Descriptions;

export default ({ application, companyId, shouldDisplayButton = true }: PropsType) => {
  const {
    addOneCompanyApplication,
    isLoadingCompanyApplications,
    isApplicationInstalledInCompany,
  } = useCurrentCompanyApplications(companyId);

  const onClickButton = async () => {
    if (!isApplicationInstalledInCompany(application.id)) {
      await addOneCompanyApplication(application.id);
    }

    ModalManager.close();
  };

  const createdDate = moment(application.stats.createdAt);

  return (
    <ObjectModal
      className="company-application-popup"
      headerStyle={{ height: 32, marginTop: 24 }}
      footerDividerStyle={{ marginTop: 0 }}
      closable
      footer={
        isApplicationInstalledInCompany(application.id) ? (
          <Tag color="var(--success)" className="company-application-popup-installed-tag">
            <Check size={16} /> Installed
          </Tag>
        ) : (
          <Button
            type="ghost"
            loading={isLoadingCompanyApplications}
            onClick={onClickButton}
            className="company-application-popup-install-btn"
          >
            Install
          </Button>
        )
      }
      title={
        <Row align="middle" justify="start">
          <Col>
            <AvatarComponent url={application.identity.icon} />
          </Col>
          <Col className="small-x-margin">
            <Title level={3} style={{ margin: 0 }}>
              {application.identity.name}
            </Title>
          </Col>
        </Row>
      }
    >
      <Divider style={{ margin: '16px 0 0 0' }} />

      <Tabs defaultActiveKey="1" tabPosition="left">
        <TabPane tab="Informations" key="1">
          <Descriptions layout="vertical" bordered>
            <Item label="Description" span={3}>
              <Text type="secondary">{application.identity.description}</Text>
            </Item>

            <Item label="Website" span={3}>
              <Link onClick={() => window.open(application.identity.website, 'blank')}>
                {application.identity.website}
              </Link>
            </Item>

            <Item label="Created" span={3}>
              <Text type="secondary">{createdDate.fromNow()}</Text>
            </Item>

            <Item label="Version" span={3}>
              <Text type="secondary">{application.stats.version}</Text>
            </Item>
          </Descriptions>
        </TabPane>
        <TabPane tab="Settings" key="2">
          TODO
        </TabPane>
      </Tabs>
    </ObjectModal>
  );
};
