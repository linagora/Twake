import { Type } from "class-transformer";

export class ChannelMember {
  @Type(() => String)
  id: string;
}
