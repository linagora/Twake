import { Entity, Column, ObjectID, ObjectIdColumn, PrimaryColumn } from "typeorm";

@Entity({ name: "channels" })
export class Channel {
  @PrimaryColumn()
  company_id: string;//"uuid-v4",

  @PrimaryColumn()
  workspace_id: string;//"uuid-v4" | "direct"

  @ObjectIdColumn()
  id: ObjectID;//"uuid-v4";

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  description: string;

  @Column()
  channel_group: string;

  // TODO: this is enum
  @Column()
  visibility: string;

  @Column()
  default: boolean;

  @Column()
  archived: boolean;

  @Column({ type: Date })
  archivation_date: Date;
}
