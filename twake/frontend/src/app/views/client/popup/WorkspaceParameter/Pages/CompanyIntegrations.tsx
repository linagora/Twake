import React, { Suspense } from 'react';

import { Typography } from 'antd';

import Languages from 'app/features/global/services/languages-service';
import ApplicationsTable from './Applications/ApplicationsTable';
import CompanyApplicationsTable from './Applications/CompanyApplicationsTable';
import './Pages.scss';

export default () => (
  <>
    <Typography.Title level={1}>
      {Languages.t('scenes.app.integrations_parameters.title')}
    </Typography.Title>

    <Suspense fallback={<></>}>
      <CompanyApplicationsTable />
      <ApplicationsTable />
    </Suspense>
  </>
);
