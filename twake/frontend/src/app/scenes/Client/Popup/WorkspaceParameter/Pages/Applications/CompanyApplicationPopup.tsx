import React from 'react';

import moment from 'moment';
import { Check } from 'react-feather';
import { Tabs, Button, Typography, Col, Tag, Descriptions, Row, Divider } from 'antd';

import { Application } from 'app/models/App';
import Languages from 'services/languages/languages';
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
          <Descriptions layout="vertical" bordered>
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
                'scenes.app.integrations_parameters.company_application_popup.tab_info.descriptions.created_item',
              )}
              span={3}
            >
              <Text type="secondary">{createdDate.toString()}</Text>
            </Item>

            <Item
              label={Languages.t(
                'scenes.app.integrations_parameters.company_application_popup.tab_info.descriptions.version_item',
              )}
              span={3}
            >
              <Text type="secondary">{application.stats.version}</Text>
            </Item>
          </Descriptions>
        </TabPane>
      </Tabs>
    </ObjectModal>
  );
};
