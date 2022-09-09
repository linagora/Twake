import { getLogger, TwakeLogger, TwakeService } from "../../framework";
import EmailPusherAPI from "./provider";
import {
  EmailBuilderDataPayload,
  EmailBuilderRenderedResult,
  EmailBuilderTemplateName,
  EmailPusherEmailType,
  EmailPusherPayload,
  EmailPusherResponseType,
} from "./types";
import * as Eta from "eta";
import { convert } from "html-to-text";
import path from "path";
import { existsSync } from "fs";
import axios from "axios";

export default class EmailPusherClass
  extends TwakeService<EmailPusherAPI>
  implements EmailPusherAPI
{
  readonly name = "email-pusher";
  readonly version: "1.0.0";
  logger: TwakeLogger = getLogger("email-pusher-service");
  apiKey: string;
  apiUrl: string;
  sender: string;

  api(): EmailPusherAPI {
    return this;
  }

  async doInit(): Promise<this> {
    Eta.configure({
      views: path.join(__dirname, "templates"),
    });

    this.apiUrl = this.configuration.get<string>("endpoint", "");
    this.apiKey = this.configuration.get<string>("secret", "");
    this.sender = this.configuration.get<string>("sender", "");

    return this;
  }

  /**
   * Generate a rendered HTML and text email
   *
   * @param {EmailBuilderTemplateName} template - the Eta template name
   * @param {String} language - the template language
   * @param {EmailBuilderDataPayload} data - the data
   * @returns {EmailBuilderRenderedResult} - the rendered html and text version
   */
  async build(
    template: EmailBuilderTemplateName,
    language: string,
    data: EmailBuilderDataPayload,
  ): Promise<EmailBuilderRenderedResult> {
    try {
      const templatePath = path.join(__dirname, language, template, ".eta");

      if (!existsSync(templatePath)) {
        throw Error("Template not found");
      }

      const html = await Eta.renderFile(templatePath, data, { async: true });

      if (!html || html.length) {
        throw Error("Failed to render tempalte");
      }

      const text = convert(html);

      return { html, text };
    } catch (error) {
      this.logger.error(`Failure when building email template: ${error}`);
    }
  }

  /**
   * Send email
   *
   * @param {string} to - the recipient
   * @param {EmailPusherPayload} email - the email object
   * @returns {Promise<void>}
   */
  async send(
    to: string,
    { subject, html: html_body, text: text_body }: EmailPusherPayload,
  ): Promise<void> {
    try {
      if (!html_body || !text_body || !subject || !to) {
        throw Error("invalid email");
      }

      const emailObject = {
        api_key: this.apiKey,
        to: [to],
        subject,
        text_body,
        html_body,
        sender: this.sender,
      };

      const { data } = await axios.post<EmailPusherEmailType, EmailPusherResponseType>(
        `${this.apiUrl}/email/send`,
        emailObject,
      );

      if (data.error && data.error.length) {
        throw Error(data.error);
      }

      if (data.failed && data.failures.length) {
        throw Error(data.failures.join(""));
      }
    } catch (error) {
      this.logger.error("Failed to send email", error);
    }
  }
}
