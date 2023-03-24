import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Button, InputRef } from 'antd';
import classNames from 'classnames';

import Languages from 'app/features/global/services/languages-service';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import MenusManager from 'app/components/menus/menus-manager';
import InputWithIcon from 'app/components/inputs/input-with-icon';

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
  const inputRef = useRef<InputRef>();

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
        inputRef={(node: InputRef) => node && (inputRef.current = node)}
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
