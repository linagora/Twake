import Message from "../types/message";

/**
 * Get message from its ID
 *
 * @param id
 */
function get(id: string): Message {
  return new Message(id);
}

/**
 * Remove a message from its ID
 *
 * @param id
 */
function remove(id: string): void {
  console.log("Deleting", id);
}

export default {
  remove,
  get
};
