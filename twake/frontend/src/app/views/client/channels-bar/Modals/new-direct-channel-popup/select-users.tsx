import React, { useEffect, useState } from 'react';
import Input from 'app/components/inputs/input';
import { useSearchUserList } from 'app/features/users/hooks/use-search-user-list';
import User from 'app/components/ui/user';
import Button from 'app/components/buttons/button';
import { UserType } from 'app/features/users/types/user';
import { Trash, Trash2, X, XCircle } from 'react-feather';

export default (props: { onChange: (users: UserType[]) => void; initialUsers: UserType[] }) => {
  const [users, setUsers] = useState<UserType[]>(props.initialUsers);
  const { search, query, result } = useSearchUserList({ scope: 'company' });

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
    <>
      <Input
        placeholder="Search users"
        style={{ width: '100%', marginBottom: '12px' }}
        onChange={(e: any) => search(e.target.value)}
      />
      {query &&
        result
          .filter(a => !users.map(a => a.id).includes(a.id))
          .slice(0, 5)
          .map(user => {
            return (
              <div key={user.id} className="new-direct-channel-proposed-user">
                <div className="user-name">
                  <User data={user} /> <span className="email">({user.email})</span>
                </div>
                <div>
                  <Button onClick={() => addUser(user)} small>
                    Add
                  </Button>
                </div>
              </div>
            );
          })}

      {users.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {users.map(user => {
            return (
              <div key={user.id} className="new-direct-channel-added-user">
                <div className="user-name">
                  <User data={user} /> <span className="email">({user.email})</span>
                </div>
                <div>
                  <Button className={'danger'} onClick={() => removeUser(user)} small>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
