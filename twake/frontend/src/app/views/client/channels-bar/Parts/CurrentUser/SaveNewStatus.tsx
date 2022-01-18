import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Button, Input } from 'antd';
import classNames from 'classnames';

import Languages from 'services/languages/languages';
import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';
import MenusManager from 'app/components/Menus/MenusManager';
import InputWithIcon from 'app/components/Inputs/InputWithIcon';

import './SaveNewStatus.scss';

type PropsType = {
  level: number;
};

export default ({ level }: PropsType): JSX.Element => {
  const { user, updateStatus } = useCurrentUser();
  const icon = user?.status?.split(' ')[0] || '';
  const text = user?.status?.split(' ').slice(1).join(' ') || '';
  const [status, setStatus] = useState([icon, text]);
  const statusRef = useRef(status);
  const inputRef = useRef<Input>();

  const save = useCallback(() => {
    updateStatus(status);
    MenusManager.closeMenu();
  }, [status, updateStatus]);

  const reset = useCallback(() => {
    updateStatus(['', '']);
    MenusManager.closeMenu();
  }, [updateStatus]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      onKeyDown={evt => {
        if (evt.key === 'Enter') save();
      }}
    >
      <InputWithIcon
        inputRef={(node: Input) => node && (inputRef.current = node)}
        focusOnDidMount
        menu_level={level}
        placeholder={Languages.t(
          'scenes.app.popup.appsparameters.pages.status_tilte',
          [],
          'Status',
        )}
        value={status}
        onChange={(value: string[]) => {
          setStatus(value);
          inputRef.current?.focus();
        }}
      />
      <div className="save-new-status-container">
        <Button
          className={classNames({ 'error-button': statusRef.current === status })}
          type={statusRef.current === status ? 'default' : 'ghost'}
          onClick={statusRef.current === status ? reset : save}
        >
          {Languages.t(
            statusRef.current === status
              ? 'scenes.app.channelsbar.currentuser.reset'
              : 'scenes.app.channelsbar.currentuser.update',
          )}
        </Button>
      </div>
    </div>
  );
};
