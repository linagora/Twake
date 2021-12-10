import React, { useEffect, useCallback, useState } from 'react';
import { Trash2 } from 'react-feather';

import Button from 'components/Buttons/Button.js';
import Languages from 'services/languages/languages';
import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';

import './SaveNewStatus.scss';
import MenusManager from 'app/components/Menus/MenusManager';
import InputWithIcon from 'app/components/Inputs/InputWithIcon';

type PropsType = {
  level: any;
};

export default (props: PropsType): JSX.Element => {
  const { user, updateStatus } = useCurrentUser();
  const icon = user?.status?.split(' ')[0] || '';
  const text = user?.status?.split(' ').slice(1).join(' ') || '';
  const [status, setStatus] = useState([icon, text]);

  const save = useCallback(() => {
    updateStatus(status);
    MenusManager.closeMenu();
  }, [status, updateStatus]);

  useEffect(() => {
    const listener = (event: { code: string; preventDefault: () => void }) => {
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        console.log('Enter key was pressed. Run your function.');
        save();
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [save]);

  const reset = useCallback(() => {
    updateStatus(['', '']);
    MenusManager.closeMenu();
  }, [updateStatus]);

  return (
    <>
      <InputWithIcon
        focusOnDidMount
        menu_level={props.level}
        placeholder={Languages.t(
          'scenes.app.popup.appsparameters.pages.status_tilte',
          [],
          'Status',
        )}
        value={status}
        onChange={(value: string[]) => {
          setStatus(value);
        }}
      />
      <div className="save-new-status-container" tabIndex={0}>
        <Trash2 className="reset-status-icon" size={16} onClick={reset} />
        <Button
          type="button"
          value={Languages.t('scenes.app.channelsbar.currentuser.update', [], 'Mettre à jour')}
          onClick={save}
        />
      </div>
    </>
  );
};
