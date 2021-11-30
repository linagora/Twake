import environment from 'app/environment/environment';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';
import { useCurrentWorkspace } from 'app/state/recoil/hooks/useWorkspaces';
import React from 'react';

export default () => {
  const { company } = useCurrentCompany();
  const { workspace } = useCurrentWorkspace();

  return (
    <>
      <b>
        {company.name} - {workspace?.name}
      </b>
      <br />
      <span style={{ opacity: 0.5 }}>{environment.api_root_url}</span>
      <br />
      <span className="link">Plan {company.plan?.name}</span>
    </>
  );
};
