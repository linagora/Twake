import { useCallback, useEffect, useState } from 'react';
import { UserType } from 'app/models/User';
import userGetAsync from '../AsyncGet';

const useUser = (userId: string): UserType | undefined => {
  const [user, setUser] = useState<UserType>();

  const fetchUser = useCallback(async () => {
    const user = await userGetAsync(userId);

    user && setUser(user);
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return user;
};

export default useUser;