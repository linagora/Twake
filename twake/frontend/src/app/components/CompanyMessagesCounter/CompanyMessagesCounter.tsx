import React, { useEffect, useState } from 'react';
import { Col, Progress, Row, Typography } from 'antd';
import './CompanyMessagesCounter.scss';
import i18n from 'i18next';

import Languages from 'services/languages/languages';
import InitService from 'services/InitService';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';
import FeatureTogglesService, { FeatureNames } from 'app/services/FeatureTogglesService';
import MessageHistoryService from 'app/services/Apps/Messages/MessageHistoryService';

const { Text, Title, Link } = Typography;
const CompanyMessagesCounter = () => {
  const [messagesCount, setMessagesCount] = useState<number>(1);
  let companyMessagesLimit = MessageHistoryService.getLimitCompanyMessages();

  const { company } = useCurrentCompany();

  const companySubscriptionUrl =
    InitService.server_infos?.configuration.accounts.console?.company_subscription_url || '';

  const onClickLink = () => window.open(companySubscriptionUrl, 'blank');

  useEffect(() => {
    if (company) {
      setMessagesCount(company.stats?.total_messages || 1);
    }
  }, [company]);

  return !FeatureTogglesService.getFeatureValue(FeatureNames.MESSAGE_HISTORY) ? (
    <>
      <Row
        justify="space-around"
        align="middle"
        wrap={false}
        style={{
          padding: '0px 0px',
          width: '100%',
        }}
      >
        <Col className="small-left-margin companyMessagesCounter" style={{ lineHeight: '16px' }}>
          <Title level={4}>
            {Languages.t('scenes.app.channelsbar.currentuser.company_messages_counter_header', [])}
          </Title>
          <Text className="info">
            {Languages.t('scenes.app.channelsbar.currentuser.company_messages_counter_info', [
              Intl.NumberFormat(i18n.language).format(companyMessagesLimit),
            ])}
          </Text>
          <div className="link">
            <Link onClick={onClickLink}>
              {Languages.t('scenes.app.channelsbar.currentuser.company_messages_counter_link', [])}
            </Link>
          </div>
        </Col>
        <Col>
          <Progress
            type="circle"
            format={() => (messagesCount / 1000).toFixed(1) + 'k'}
            percent={(messagesCount / companyMessagesLimit) * 100}
            width={55}
          />
        </Col>
      </Row>
    </>
  ) : (
    <></>
  );
};
export default CompanyMessagesCounter;
