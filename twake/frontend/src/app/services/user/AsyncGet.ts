import { UserType } from "app/models/User";
import UserAPIClient from "./UserAPIClient";
import Collections from 'app/services/Depreciated/Collections/Collections';

const currentUserRequests: { [key: string]: PromiseLike<UserType | null> } = {};
const usersCollection = Collections.get('users');

export default async (id: string): Promise<UserType | null> => {
  if (
    usersCollection.known_objects_by_id[id] &&
    new Date(usersCollection.known_objects_by_id[id]?._last_modified || 0).getTime() >
      new Date().getTime() - 1000 * 60 * 60
  ) {
    return usersCollection.known_objects_by_id[id];
  }

  if (currentUserRequests[id]) {
    // there are already pending requests for the same user, wait for them
    // FIXME: We should have a timeout
    await currentUserRequests[id];
    delete currentUserRequests[id];
    return usersCollection.known_objects_by_id[id];
  } else {
    const userPromise = new Promise<UserType | null>(async resolve => {
      const users = await UserAPIClient._list([id]);
      const user = users.length ? users[0] : null;
      user && usersCollection.updateObject(user);
      resolve(user);
    });
    currentUserRequests[id] = userPromise;

    return userPromise;
  }
};
