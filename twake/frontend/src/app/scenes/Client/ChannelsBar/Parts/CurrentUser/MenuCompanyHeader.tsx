import environment from 'app/environment/environment';
import { CurrentCompanyLogo } from 'app/scenes/Client/WorkspacesBar/Components/CompanySelector';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';
import { useCurrentWorkspace } from 'app/state/recoil/hooks/useWorkspaces';
import React from 'react';

export default () => {
  const { company } = useCurrentCompany();
  const { workspace } = useCurrentWorkspace();

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'start' }}>
      <div style={{ width: 32, height: 32, marginRight: 8 }}>
        <CurrentCompanyLogo size={32} withCompanyName={false} />
      </div>
      <div style={{ flex: 1, lineHeight: '1.2em' }}>
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px',
            display: 'inline-block',
          }}
        >
          <b>
            {(company.name || '').substr(0, 16)} - {workspace?.name}
          </b>
        </span>
        <span style={{ opacity: 0.5 }}>
          {environment.api_root_url.split('//').pop()?.split('/').shift()}
        </span>
        <span className="link" style={{ marginLeft: 8 }}>
          Plan {company.plan?.name}
        </span>
      </div>
    </div>
  );
};
