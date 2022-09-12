import { TwakeServiceProvider } from "../../framework";
import {
  EmailBuilderDataPayload,
  EmailBuilderRenderedResult,
  EmailBuilderTemplateName,
  EmailLanguageType,
  EmailPusherPayload,
} from "./types";

export default interface EmailPusherAPI extends TwakeServiceProvider {
  build(
    template: EmailBuilderTemplateName,
    language: EmailLanguageType,
    data: EmailBuilderDataPayload,
  ): Promise<EmailBuilderRenderedResult>;

  send(to: string, email: EmailPusherPayload): Promise<void>;
}
