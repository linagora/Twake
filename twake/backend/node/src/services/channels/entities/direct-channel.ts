import { Type } from "class-transformer";

/**
 * Direct Channel information.
 * A direct channel is a channel in a company composed of a defined set of users.
 */
export class DirectChannel {
  /**
   * The company identifier of this channel
   * uuid-v4
   */
  @Type(() => String)
  company_id: string;

  /**
   * The link to Channel.id
   * uuid-v4
   */
  @Type(() => String)
  channel_id: string;

  /**
   * CSV list of ordered user ids
   */
  users: string;

  static getUsersAsString(users: string[] = []): string {
    return users.sort().join(",");
  }

  static getUsersFromString(identifier: string = ""): string[] {
    return identifier.split(",");
  }
}
