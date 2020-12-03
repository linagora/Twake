import { Type } from "class-transformer";

export class ChannelThreadUsers {
  /**
   * UUIDv4
   * Primary key / partition key
   */
  @Type(() => String)
  company_id: string;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  channel_id: string;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  thread_id: string;

  /**
   * UUIDv4
   */
  @Type(() => String)
  user_id: string;
}

export type ChannelThreadUsersPrimaryKey = Pick<
  ChannelThreadUsers,
  "company_id" | "channel_id" | "thread_id"
>;
