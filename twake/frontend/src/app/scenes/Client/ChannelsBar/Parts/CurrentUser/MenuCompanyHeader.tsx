import environment from 'app/environment/environment';
import { CurrentCompanyLogo } from 'app/scenes/Client/WorkspacesBar/Components/CompanySelector';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';
import { useCurrentWorkspace } from 'app/state/recoil/hooks/useWorkspaces';
import React from 'react';

export default () => {
  const { company } = useCurrentCompany();
  const { workspace } = useCurrentWorkspace();

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 48, alignItems: 'start' }}>
      <div style={{ width: 40, height: 32 }}>
        <CurrentCompanyLogo size={32} withCompanyName={false} />
      </div>
      <div style={{ flex: 1, lineHeight: '1.2em' }}>
        <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {company.name} - {workspace?.name}
        </b>
        <br />
        <span style={{ opacity: 0.5 }}>
          {environment.api_root_url.split('//').pop()?.split('/').shift()}
        </span>
        <br />
        <span className="link">Plan {company.plan?.name}</span>
      </div>
    </div>
  );
};
