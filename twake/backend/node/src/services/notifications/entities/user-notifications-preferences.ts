import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { merge } from "lodash";

export const TYPE = "user_notification_preferences";

/**
 * Table user-notification-preferences
 */
@Entity(TYPE, {
  primaryKey: [["user_id"], "company_id"],
  type: TYPE,
})
export class UserNotificationPreferences {
  /**
   * UUIDv4
   * Primary key / partition key
   */
  @Column("user_id", "string")
  user_id: string;

  /**
   * UUIDv4
   * Partition key
   */
  @Column("company_id", "string")
  company_id: string | "all";

  @Column("preferences", "encoded_json")
  preferences: {
    highlight_words: string[];
    night_break: {
      enable: boolean;
      from: number;
      to: number;
    };
    private_message_content: boolean;
    mobile_notifications: "never" | "when_inactive" | "always";
    email_notifications_delay: number; //0: never send email, 1 and more in minutes from first unread notification
    deactivate_notifications_until: number;
    notification_sound: "default" | "none" | string;
  };
}

export type UserNotificationPreferencesPrimaryKey = Pick<
  UserNotificationPreferences,
  "company_id" | "user_id"
>;

export function getInstance(preferences: UserNotificationPreferences): UserNotificationPreferences {
  return merge(new UserNotificationPreferences(), preferences);
}
