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

  @Column("name", "string")
  name: string;
  
  @Column("display_name", "encoded_string")
  displayName: string;
  
  @Column("logo_id", "uuid")
  lofo: string;
  
  @Column("plan", "encoded_string")
  plan: string;
  
  @Column("workspaces_id", "encoded_json")
  workspaces: Array<string>;

  @Column("managers_id", "encoded_json")
  managers: Array<string>;
  
  @Column("date_added", "number")
  dateAdded: number;

  @Column("on_creation_data", "encoded_json")
  onCreationData: any;

  @Column("is_blocked", "boolean")
  isBlocked: boolean;
  
  @Column("is_private", "boolean")
  isPrivate: boolean;

  @Column("member_count", "number")
  memberCount: number;
}

export type CompanyPrimaryKey = Pick<Company, "id">;
