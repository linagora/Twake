import React from 'react';

import moment from 'moment';
import { capitalize } from 'lodash';
import { Check } from 'react-feather';
import { Tabs, Button, Typography, Col, Tag, Descriptions, Row, Divider } from 'antd';

import { Application, ApplicationAccess } from 'app/models/App';
import Languages from 'services/languages/languages';
import AvatarComponent from 'app/components/Avatar/Avatar';
import ObjectModal from 'app/components/ObjectModal/ObjectModal';
import ModalManager from 'app/components/Modal/ModalManager';
import { useCurrentCompanyApplications } from 'app/state/recoil/hooks/useCurrentCompanyApplications';

import './ApplicationsStyles.scss';

type PropsType = {
  application: Application;
  companyId: string;
};

const { TabPane } = Tabs;
const { Text, Link, Title } = Typography;
const { Item } = Descriptions;

const InformationsDescriptions = ({ application }: { application: Application }) => {
  const createdDate = moment(application.stats.createdAt).format('L');

  return (
    <Descriptions layout="vertical" bordered>
      <Item
        label={Languages.t(
          'scenes.app.integrations_parameters.company_application_popup.tab_info.descriptions.website_item',
        )}
        span={3}
      >
        <Link onClick={() => window.open(application.identity.website, 'blank')}>
          {application.identity.website}
        </Link>
      </Item>

      <Item
        label={Languages.t(
          'scenes.app.integrations_parameters.company_application_popup.tab_info.descriptions.description_item',
        )}
        span={3}
      >
        <Text type="secondary">{application.identity.description}</Text>
      </Item>

      <Item
        label={Languages.t(
          'scenes.app.integrations_parameters.company_application_popup.tab_info.descriptions.created_item',
        )}
        span={3}
      >
        <Text type="secondary">{createdDate}</Text>
      </Item>

      <Item label="Compatible with Twake" span={3}>
        <Text type="secondary">
          {application.identity.compatibility.includes('twake')
            ? 'Yes'
            : `No, this integration is compatible with ${application.identity.compatibility
                .map(v => capitalize(v))
                .join(', ')}.`}
        </Text>
      </Item>
    </Descriptions>
  );
};

const AccessDescriptions = ({ application }: { application: Application }) => (
  <Descriptions layout="vertical" bordered>
    {Object.keys(application.access).map(key => {
      const values: string[] = (application.access as any)[key];

      return (
        <Item label={capitalize(key === 'hooks' ? 'listened events' : key)} span={3}>
          {values?.length > 0 ? (
            values.map(v => <Tag color="var(--success)">{v}</Tag>)
          ) : (
            <Text style={{ minHeight: 22 }} type="secondary">
              This integration doesn't have any {key} access
            </Text>
          )}
        </Item>
      );
    })}
  </Descriptions>
);

export default ({ application, companyId }: PropsType) => {
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

  return (
    <ObjectModal
      className="company-application-popup"
      headerStyle={{ height: 32, marginTop: 24 }}
      footerDividerStyle={{ marginTop: 0 }}
      closable
      footer={
        isApplicationInstalledInCompany(application.id) ? (
          <Tag color="var(--success)" className="company-application-popup-installed-tag">
            <Check size={16} />{' '}
            {Languages.t('scenes.app.integrations_parameters.company_application_popup.tag')}
          </Tag>
        ) : (
          <Button
            type="ghost"
            loading={isLoadingCompanyApplications}
            onClick={onClickButton}
            className="company-application-popup-install-btn"
          >
            {Languages.t('scenes.app.integrations_parameters.company_application_popup.btn')}
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
        <TabPane
          tab={Languages.t(
            'scenes.app.integrations_parameters.company_application_popup.tab_btn_info',
          )}
          key="1"
        >
          <InformationsDescriptions application={application} />
        </TabPane>

        <TabPane tab="App access" key="2">
          <AccessDescriptions application={application} />
        </TabPane>
      </Tabs>
    </ObjectModal>
  );
};
