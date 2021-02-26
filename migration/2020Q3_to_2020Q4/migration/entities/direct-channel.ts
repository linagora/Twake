import { Type } from "class-transformer";
import { Column, Entity } from "../services/db/orm/decorators";

/**
 * Direct Channel information.
 * A direct channel is a channel in a company composed of a defined set of users.
 */
@Entity("direct_channels", {
  primaryKey: [["company_id", "users"], "channel_id"],
  type: "direct_channels",
})
export class DirectChannel {
  /**
   * The company identifier of this channel
   * uuid-v4
   */
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  /**
   * CSV list of ordered user ids
   */
  @Column("users", "plainstring")
  users: string;

  /**
   * The link to Channel.id
   * uuid-v4
   */
  @Type(() => String)
  @Column("channel_id", "plainstring")
  channel_id: string;

  static getUsersAsString(users: string[] = []): string {
    return users.sort().join(",");
  }

  static getUsersFromString(identifier: string = ""): string[] {
    return identifier.split(",");
  }
}
