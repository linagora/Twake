import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "threads";
@Entity(TYPE, {
  primaryKey: [["id"]],
  type: TYPE,
})
export class Thread {
  @Type(() => String)
  @Column("id", "timeuuid", { order: "DESC" })
  id: string;

  @Type(() => String)
  @Column("created_by", "string")
  created_by: string;

  @Type(() => Number)
  @Column("created_at", "number")
  created_at: number;

  @Column("updated_at", "number", { onUpsert: _ => new Date().getTime() })
  updated_at: number;

  @Type(() => Number)
  @Column("last_activity", "number")
  last_activity: number;

  @Type(() => Number)
  @Column("answers", "number")
  answers: number;

  @Column("participants", "encoded_json")
  participants: ParticipantObject[];
}

export type ParticipantObject = {
  type: "user" | "channel";
  created_at: number;
  created_by: string;
  id: string;
  company_id: string;
  workspace_id?: string;
};

export type ThreadPrimaryKey = Pick<Thread, "id">;

export function getInstance(thread: Thread): Thread {
  return merge(new Thread(), thread);
}
