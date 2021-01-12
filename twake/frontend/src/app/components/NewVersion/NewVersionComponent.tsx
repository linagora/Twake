import React, { FC, useEffect, useState } from 'react';

import Api from 'services/Api';
import Banner from 'app/components/Banner/Banner';
import Emojione from 'app/components/Emojione/Emojione';
import { ConfigurationResource, ConfigurationType } from 'app/models/Configuration';
import Environment from 'environment/environment';
import { Col, Layout, Row, Typography } from 'antd';

const NewVersionComponent: FC = ({ children }) => {
  const [displayBanner, setDisplayBanner] = useState<boolean>(true);
  let lastScrape: number = 0;

  useEffect(() => {
    setInterval(() => {
      getConfiguration();
    }, 1000 * 60 * 60);
  }, []);

  const compareVersion: (v1: string, v2: string) => number = (v1: string, v2: string) => {
    const toNumber: (v: string) => number = (v: string) => {
      const a = v.split('.').map((s: string) => parseInt(s.replace(/[^0-9]/g, '')));
      return 1000000 * (1000 * a[0] + a[1]) + a[2];
    };
    return toNumber(v1) - toNumber(v2);
  };

  const getConfiguration = async () => {
    if (new Date().getTime() - lastScrape < 30000) {
      return;
    }
    lastScrape = new Date().getTime();

    const config = (await Api.get('core/version')) as ConfigurationResource;
    const currentVersion = Environment.version_detail;
    const newestVersion = config.data.version?.current || '';

    const shouldDisplayBanner: boolean =
      compareVersion(newestVersion, currentVersion) > 0 ? true : false;

    console.log('shouldHideBanner', shouldDisplayBanner);
    return setDisplayBanner(shouldDisplayBanner);
  };

  return (
    <Layout key="appPage" className="appPage">
      {displayBanner && (
        <Banner
          height={32}
          type="primary"
          content={
            <Row align="middle" gutter={[8, 0]}>
              <Col>
                <b>You are running an outdated Twake version</b>, we suggest you to reload the app
                and enjoying our new features! <Emojione type="rocket" />
              </Col>
              <Col>
                <Typography.Link
                  style={{ color: 'var(--white)' }}
                  underline
                  onClick={() => window.location.reload()}
                >
                  Click here to reload
                </Typography.Link>
              </Col>
            </Row>
          }
          closable
          onClose={() => setDisplayBanner(false)}
        />
      )}
      {children}
    </Layout>
  );
};
export default NewVersionComponent;
