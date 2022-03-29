import React, { Suspense } from 'react';

import { Button, Row, Typography } from 'antd';

import Languages from 'app/features/global/services/languages-service';
import ApplicationsTable from './Applications/ApplicationsTable';
import CompanyApplicationsTable from './Applications/CompanyApplicationsTable';
import ApplicationCreator from '../../application-parameters/pages/application-creator';
import ModalManager from 'app/components/modal/modal-manager';

import './Pages.scss';

export default () => (
  <>
    <Row wrap={false} align="middle" justify="space-between">
      <Typography.Title level={1}>
        {Languages.t('scenes.app.integrations_parameters.title')}
      </Typography.Title>

      <Button
        type="primary"
        onClick={() =>
          ModalManager.open(<ApplicationCreator />, {
            position: 'center',
            size: { width: '600px', minHeight: '329px' },
          })
        }
      >
        {/* TODO: Translation here */}
        New integration
      </Button>
    </Row>

    <Suspense fallback={<></>}>
      <CompanyApplicationsTable />
      <ApplicationsTable />
    </Suspense>
  </>
);
