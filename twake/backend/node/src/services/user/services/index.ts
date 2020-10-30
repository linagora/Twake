import User from "../entity/user";

/**
 * Get user from its ID
 *
 * @param userId
 */
function get(id: string): User {
  return new User(id);
}

/**
 * Remove a user from its ID
 *
 * @param id
 */
function remove(id: string): void {
  console.log("Deleting", id);
}

function findByUsername(username: string): User {
  return new User(username);
}

export default {
  findByUsername,
  remove,
  get,
};
