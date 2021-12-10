import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Button } from 'antd';

import Languages from 'services/languages/languages';
import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';
import MenusManager from 'app/components/Menus/MenusManager';
import InputWithIcon from 'app/components/Inputs/InputWithIcon';
import classNames from 'classnames';

import './SaveNewStatus.scss';

type PropsType = {
  level: any;
};

export default (props: PropsType): JSX.Element => {
  const { user, updateStatus } = useCurrentUser();
  const icon = user?.status?.split(' ')[0] || '';
  const text = user?.status?.split(' ').slice(1).join(' ') || '';
  const [status, setStatus] = useState([icon, text]);
  const toto = useRef(status);

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
    <div
      onKeyDown={evt => {
        if (evt.key === 'Enter') save();
      }}
    >
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
      <div className="save-new-status-container">
        {
          <Button
            className={classNames({ 'error-button': toto.current === status })}
            type={toto.current === status ? 'default' : 'ghost'}
            onClick={toto.current === status ? reset : save}
          >
            {Languages.t(
              toto.current === status
                ? 'scenes.app.channelsbar.currentuser.reset'
                : 'scenes.app.channelsbar.currentuser.update',
            )}
          </Button>
        }
      </div>
    </div>
  );
};
