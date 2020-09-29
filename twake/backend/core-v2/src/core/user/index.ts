import User from "./models";

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
  console.log('Deleting', id);
}

export default {
  remove,
  get
};
