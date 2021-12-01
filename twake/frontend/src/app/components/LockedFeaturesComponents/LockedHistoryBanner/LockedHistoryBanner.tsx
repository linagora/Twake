import React from 'react';
import { Typography, Button } from 'antd';
import Banner from 'app/components/Banner/Banner';
import Emojione from 'app/components/Emojione/Emojione';
import Languages from 'services/languages/languages';
import './LockedHistoryBanner.scss';
import InitService from 'app/services/InitService';

const { Title, Text } = Typography;
const LockedHistoryBanner = (): JSX.Element => {
  const onClickBtn = () =>
    window.open(
      InitService.server_infos?.configuration?.accounts?.console?.company_subscription_url || '',
      'blank',
    );

  return (
    <Banner
      type="ghost"
      height={135}
      className="locked-history-banner"
      contentColumnStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        width: '380px',
      }}
    >
      <div className="title-container">
        <Emojione type=":rocket:" s64 />
        <Title level={5} className="title">
          {Languages.t('components.locked_features.locked_history_banner.title')}
        </Title>
      </div>
      <Text type="secondary" className="description">
        {Languages.t('components.locked_features.locked_history_banner.description')}
      </Text>
      <Button type="primary" size="middle" onClick={onClickBtn} style={{ margin: '16px 0 16px 0' }}>
        {Languages.t('components.locked_features.locked_history_banner.button')}
      </Button>
    </Banner>
  );
};

export default LockedHistoryBanner;
