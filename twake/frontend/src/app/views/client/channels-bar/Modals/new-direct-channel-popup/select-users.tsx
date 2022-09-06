import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@atoms/input/input-text';
import { useSearchUsers } from 'app/features/users/hooks/use-search-user-list';
import User from 'app/components/ui/user';
import { Button } from '@atoms/button/button';
import { UserType } from 'app/features/users/types/user';
import { InputDecorationIcon } from 'app/atoms/input/input-decoration-icon';
import { SearchIcon } from '@heroicons/react/solid';
import { Info } from 'app/atoms/text';
import Languages from 'app/features/global/services/languages-service';

export default (props: { onChange: (users: UserType[]) => void; initialUsers: UserType[] }) => {
  const [users, setUsers] = useState<UserType[]>(props.initialUsers);
  const { search, result } = useSearchUsers({ scope: 'company' });

  const inputElement = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputElement.current) inputElement.current.focus();
  }, []);

  useEffect(() => {
    props.onChange(users);
  }, [users]);

  const addUser = (user: UserType) => {
    setUsers([...users, user].filter(a => a) as UserType[]);
  };

  const removeUser = (user: UserType) => {
    setUsers(users.filter(a => a.id !== user.id) as UserType[]);
  };

  return (
    <div style={{ width: '100vw', maxWidth: '500px' }}>
      <InputDecorationIcon
        prefix={SearchIcon}
        input={({ className }) => (
          <Input
            placeholder="Search users"
            className={className + ' mt-2 mb-4 w-full'}
            theme="plain"
            inputRef={inputElement}
            onChange={e => search(e.target.value)}
          />
        )}
      />
      <div style={{ minHeight: 200 }}>
        {result.length === 0 && (
          <div className="text-center pt-8">
            <Info>{Languages.t('components.user_picker.modal_no_result')}</Info>
          </div>
        )}
        {result
          .filter(a => !users.map(a => a.id).includes(a.id))
          .slice(0, 5)
          .map(user => {
            return (
              <div key={user.id} className="new-direct-channel-proposed-user">
                <div className="user-name">
                  <User data={user} />{' '}
                  <span className="email overflow-hidden text-ellipsis whitespace-nowrap">
                    ({user.email})
                  </span>
                </div>
                <div>
                  <Button onClick={() => addUser(user)} size="sm">
                    Add
                  </Button>
                </div>
              </div>
            );
          })}
      </div>
      {users.length > 0 && (
        <div className="border-t border-t-zinc-200 py-4">
          {users.map(user => {
            return (
              <div key={user.id} className="new-direct-channel-added-user">
                <div className="user-name">
                  <User data={user} />{' '}
                  <span className="email overflow-hidden text-ellipsis whitespace-nowrap">
                    ({user.email})
                  </span>
                </div>
                <div>
                  <Button theme={'danger'} onClick={() => removeUser(user)} size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
