import React, { FC, useEffect, useMemo, useState } from 'react';

import Api from 'services/Api';
import Banner from 'app/components/Banner/Banner';
import Emojione from 'app/components/Emojione/Emojione';
import { ConfigurationResource } from 'app/models/Configuration';
import Environment from 'environment/environment';
import { Col, Layout, Row, Typography } from 'antd';
import Languages from 'services/languages/languages.js';
import ModalManager from 'app/components/Modal/ModalManager';
import NewVersionModal from './NewVersionModal';

let lastScrape: number = 0;

const NewVersionComponent: FC = ({ children }) => {
  const [displayBanner, setDisplayBanner] = useState<boolean>(false);

  const compareVersion: (v1: string, v2: string) => number = (v1: string, v2: string) => {
    const toNumber: (v: string) => number = (v: string) => {
      const a = v.split('.').map((s: string) => parseInt(s.replace(/[^0-9]/g, '')));
      return 1000000 * (1000 * a[0] + a[1]) + a[2];
    };
    return toNumber(v1) - toNumber(v2);
  };

  const getConfiguration = async () => {
    if (new Date().getTime() - lastScrape < 15 * 60 * 1000) {
      return;
    }
    lastScrape = new Date().getTime();

    const config = (await Api.get('core/version')) as ConfigurationResource;
    const currentVersion: string = (window as any).version_detail;
    const newestVersion: string = config.data.version?.current || '';
    const minimalWebVersion: string = config.data.version?.minimal?.web || '';

    const shouldDisplayModal: boolean =
      minimalWebVersion && compareVersion(minimalWebVersion, currentVersion) > 0 ? true : false;
    const shouldDisplayBanner: boolean =
      newestVersion && compareVersion(newestVersion, currentVersion) > 0 && !shouldDisplayModal
        ? true
        : false;

    if (shouldDisplayModal) {
      return ModalManager.open(
        <NewVersionModal />,
        {
          position: 'center',
          size: { width: '600px' },
        },
        false,
      );
    }

    if (shouldDisplayBanner) {
      return setDisplayBanner(shouldDisplayBanner);
    }
  };

  useMemo(() => {
    document.addEventListener('visibilitychange', () => {
      getConfiguration();
    });
    window.addEventListener('focus', () => {
      getConfiguration();
    });
    getConfiguration();
  }, []);

  return (
    <Layout key="appPage" className="appPage">
      {displayBanner && (
        <Banner
          height={32}
          type="primary"
          content={
            <Row align="middle" gutter={[8, 0]}>
              <Col>
                <b>{Languages.t('components.newversion.new_version_component.row.part_1')}</b>,{' '}
                {Languages.t('components.newversion.new_version_component.row.part_2')}{' '}
                <Emojione type="rocket" />
              </Col>
              <Col>
                <Typography.Link
                  style={{ color: 'var(--white)' }}
                  underline
                  onClick={() => window.location.reload()}
                >
                  {Languages.t('components.newversion.new_version_component.link')}
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
