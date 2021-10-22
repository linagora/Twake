import React, { Suspense } from 'react';

import { Typography } from 'antd';

import ApplicationsTable from './Applications/ApplicationsTable';
import CompanyApplicationsTable from './Applications/CompanyApplicationsTable';

import './Pages.scss';

export default () => {
  return (
    <div className="workspaceParameter">
      {/* // TODO translation here */}
      <Typography.Title level={1}>Integrations</Typography.Title>

      <Suspense fallback={<></>}>
        <CompanyApplicationsTable />
        <ApplicationsTable />
      </Suspense>
    </div>
  );
};
