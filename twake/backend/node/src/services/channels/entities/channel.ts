import { Entity, Column, ObjectID, ObjectIdColumn, PrimaryColumn } from "typeorm";

export enum VisibilityEnum {
  PRIVATE = "private",
  PUBLIC = "public",
  DIRECT = "direct"
}

@Entity({ name: "channels" })
export class Channel {
  // uuid-v4
  @PrimaryColumn()
  company_id: string;

  // "uuid-v4" | "direct"
  @PrimaryColumn()
  workspace_id: string;

  //"uuid-v4"
  @ObjectIdColumn()
  id: ObjectID | string;

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  description: string;

  @Column()
  channel_group: string;

  @Column("text")
  visibility: VisibilityEnum;

  @Column()
  default: boolean;

  @Column()
  archived: boolean;

  @Column({ type: Date })
  archivation_date: Date;
}
