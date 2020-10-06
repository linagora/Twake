import Channel from "../entity/channel";

/**
 * Get channel from its ID
 *
 * @param id
 */
function get(id: string): Channel {
  return new Channel(id);
}

/**
 * Remove a channel from its ID
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
