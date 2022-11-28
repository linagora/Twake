import { TwakeServiceProvider } from "../../framework";
import {
  EmailBuilderDataPayload,
  EmailBuilderRenderedResult,
  EmailBuilderTemplateName,
  EmailPusherPayload,
} from "./types";

export default interface EmailPusherAPI extends TwakeServiceProvider {
  build(
    template: EmailBuilderTemplateName,
    language: string,
    data: EmailBuilderDataPayload,
  ): Promise<EmailBuilderRenderedResult>;

  send(to: string, email: EmailPusherPayload): Promise<void>;
}
