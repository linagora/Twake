import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

// backward compatibility with PHP where companies used to be `group_entity`
export const TYPE = "group_entity";

@Entity(TYPE, {
  primaryKey: [["id"]],
  type: TYPE,
})
export default class Company {
  @Column("id", "uuid")
  id: string;

  @Column("name", "encoded_string")
  name: string;

  @Column("logo_id", "uuid")
  logo: string;

  @Column("plan", "encoded_json")
  plan: any;

  @Column("stats", "encoded_json")
  stats: any;

  @Column("date_added", "number")
  dateAdded: number;

  @Column("on_creation_data", "encoded_json")
  onCreationData: any;

  @Column("is_blocked", "boolean")
  isBlocked: boolean;

  @Column("member_count", "number")
  memberCount: number;
}

export type CompanyPrimaryKey = Pick<Company, "id">;
