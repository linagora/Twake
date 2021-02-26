import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

// backward compatibility with PHP where companies used to be `group`
export const TYPE = "group_user";

/**
 * Link between a company and a user
 */
@Entity(TYPE, {
  primaryKey: [["group_id"], "user_id", "id"],
  type: TYPE,
})
export default class CompanyUser {
  @Column("group_id", "uuid")
  group_id: string;

  @Column("user_id", "uuid")
  user_id: string;

  @Column("id", "uuid")
  id: string;
  
  @Column("level", "number")
  level: number;
  
  @Column("did_connect_today", "boolean")
  didConnectToday: boolean;
  
  @Column("app_used_today", "json")
  appUsedToday: Array<string>;
  
  @Column("nb_workspace", "number")
  nbWorkspaces: number;

  @Column("date_added", "number")
  dateAdded: number;

  @Column("last_update_day", "number")
  lastUpdateDay: number;

  @Column("nb_connections_period", "number")
  nbConnectionsPeriod: number;

  @Column("app_used_period", "number")
  appUsedPeriod: number;
}

export type CompanyUserPrimaryKey = Pick<CompanyUser, "group_id">;
