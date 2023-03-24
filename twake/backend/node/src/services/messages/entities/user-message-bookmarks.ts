import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "user_message_bookmarks";
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "id"],
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
  @Column("id", "uuid", { generator: "uuid" })
  id: string;

  @Type(() => String)
  @Column("name", "encoded_string")
  name = "";
}

export type UserMessageBookmarkPrimaryKey = Pick<
  UserMessageBookmark,
  "company_id" | "user_id" | "id"
>;

export function getInstance(
  bookmark: Pick<UserMessageBookmark, "company_id" | "user_id" | "name">,
): UserMessageBookmark {
  return merge(new UserMessageBookmark(), bookmark);
}
