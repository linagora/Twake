import "reflect-metadata";
import { describe, expect, it } from "@jest/globals";
import { buildSelectQuery } from "../../../../../../../../../src/core/platform/services/database/services/orm/connectors/cassandra/query-builder";
import { ChannelMemberNotificationPreference } from "../../../../../../../../../src/services/notifications/entities/channel-member-notification-preferences";

describe("The QueryBuilder module", () => {
  describe("The buildSelectQuery function", () => {
    it("should build a valid query from primary key parameters", () => {
      const filters = {
        company_id: "comp1",
        channel_id: "chan1",
      };
      const result = buildSelectQuery<ChannelMemberNotificationPreference>(
        ChannelMemberNotificationPreference,
        filters,
        { keyspace: "twake" },
      );

      expect(result).toEqual(
        "SELECT * FROM twake.channel_members_notification_preferences WHERE company_id = comp1 AND channel_id = chan1",
      );
    });

    it("should build IN query from array parameters", () => {
      const filters = {
        company_id: "comp1",
        channel_id: "chan1",
        user_id: ["u1", "u2", "u3"],
      };
      const result = buildSelectQuery<ChannelMemberNotificationPreference>(
        ChannelMemberNotificationPreference,
        filters,
        { keyspace: "twake" },
      );

      expect(result).toEqual(
        "SELECT * FROM twake.channel_members_notification_preferences WHERE company_id = comp1 AND channel_id = chan1 AND user_id IN (u1,u2,u3)",
      );
    });

    it("should not build IN query from array parameters when array is empty", () => {
      const filters = {
        company_id: "comp1",
        channel_id: "chan1",
        user_id: [],
      };
      const result = buildSelectQuery<ChannelMemberNotificationPreference>(
        ChannelMemberNotificationPreference,
        filters,
        { keyspace: "twake" },
      );

      expect(result).toEqual(
        "SELECT * FROM twake.channel_members_notification_preferences WHERE company_id = comp1 AND channel_id = chan1",
      );
    });
  });
});
