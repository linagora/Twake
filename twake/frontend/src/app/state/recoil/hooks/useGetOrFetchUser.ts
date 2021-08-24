import { useRecoilCallback, useRecoilState } from "recoil";
import { UserType } from "app/models/User";
import UserAPIClient from "app/services/user/UserAPIClient";
import { UserListState } from "../atoms/UserList";

const useGetOrFetchUser = () => {
  const [users, setUsers] = useRecoilState(UserListState);

  const fetchUser = useRecoilCallback(() => async (id: string) => {
    const index = users.findIndex(user => user.id === id);
    let user: UserType | null = null;

    if (index > -1) {
      console.log("User already exists", index);
      user = users[index];
    } else {
      console.log("Get new user", id);

      const apiUser = await UserAPIClient.list([id]);

      if (apiUser && apiUser.length) {
        user = apiUser[0];
        setUsers(() => [...users, apiUser[0]]);
      }
    }

    return {
      id,
      user
    };
  });

  return fetchUser;
};

export default useGetOrFetchUser;
