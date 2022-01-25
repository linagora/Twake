import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import Languages from 'services/languages/languages';
import popupManager from 'services/popupManager/popupManager.js';
import AutoHeight from 'app/components/auto-height/auto-height';
import ConsoleService from 'app/services/Console/ConsoleService';
import RouterServices from 'app/features/router/services/router-service';
import WorkspacesUsers from 'app/services/workspaces-user/workspaces_users';
import './AddUser.scss';
import MagicLinks from './MagicLinks';

type PropsType = {
  [key: string]: any;
  noMagicLink?: boolean;
  inline?: boolean;
};

export default (props: PropsType): JSX.Element => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emails, _setEmails] = useState<string[]>([]);

  const setEmails = (str: string) => _setEmails(WorkspacesUsers.fullStringToEmails(str));

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setEmails(e.target.value);

  const onClickBtn = async () => {
    if (props.onChange) {
      props.onChange(emails);
    }

    if (props.finish) {
      props.finish();
      return;
    }
    setLoading(true);
    setDisabled(true);

    return await ConsoleService.addMailsInWorkspace({
      workspace_id: workspaceId || '',
      company_id: companyId || '',
      emails,
    }).finally(() => {
      setLoading(false);
      setDisabled(false);
      return close();
    });
  };

  const close = () => {
    if (props.inline) {
      return;
    }
    setTimeout(() => {
      popupManager.close();
    }, 200);
  };
  return (
    <div className="add-user-from-twake-console">
      <Typography.Title level={3} className="">
        {Languages.t('scenes.app.workspaces.create_company.invitations.title_2')}{' '}
      </Typography.Title>
      <div className="user-list-container small-y-margin">
        <AutoHeight
          minHeight="120px"
          maxHeight="120px"
          onChange={onChange}
          placeholder={Languages.t('components.add_mails_workspace.text_area_placeholder')}
        />
      </div>
      <div className="current-user-state small-text small-top-margin">
        {Languages.t('scenes.app.popup.adduserfromtwakeconsole.current_users_state', [
          emails.length || 0,
        ])}
      </div>
      <div className="current-user-state">
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {Languages.t('scenes.app.popup.adduser.adresses_message')}
        </Typography.Text>
      </div>

      <div className="add-user-button-container">
        <Button
          type="primary"
          onClick={onClickBtn}
          disabled={disabled || props.loading}
          loading={loading || props.loading}
        >
          {emails.length === 0
            ? Languages.t('scenes.app.workspaces.components.skip')
            : Languages.t('general.add')}
        </Button>
      </div>

      {!props.noMagicLink && (
        <div className="magic-links-wrapper">
          <br />
          <MagicLinks />
        </div>
      )}
    </div>
  );
};
