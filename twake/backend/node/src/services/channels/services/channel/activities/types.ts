import { Channel } from "../../../../types";
import User from "../../../../../services/user/entity/user";
import { ChannelMember } from "../../../../../services/channels/entities";

export type ActorType = { type: string; id: User["id"] };

export type ResourceObjectType = {
  type: string;
  resource: Channel | User | ChannelMember | [];
};

export type ContextType = {
  type: "add" | "remove" | "diff";
  array?: ResourceObjectType[];
  previous?: ResourceObjectType;
  next?: ResourceObjectType;
};

export type GenericObjectType = {
  type: string;
  actor: ActorType;
  context: ContextType;
};
