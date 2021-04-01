import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "user_message_bookmarks";
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "name"],
  type: TYPE,
})
export class UserMessageBookmark {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("user_id", "uuid")
  user_id: string;

  @Type(() => String)
  @Column("name", "encoded_string")
  name: string;
}

export type UserMessageBookmarkPrimaryKey = Pick<
  UserMessageBookmark,
  "company_id" | "user_id" | "name"
>;

export function getInstance(bookmark: UserMessageBookmark): UserMessageBookmark {
  return merge(new UserMessageBookmark(), bookmark);
}
