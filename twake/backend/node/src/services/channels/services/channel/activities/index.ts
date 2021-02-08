import { PubsubServiceAPI } from "../../../../../core/platform/services/pubsub/api";
import Activities from "./service";

export const getService = (pubsub: PubsubServiceAPI): Activities => new Activities(pubsub);
