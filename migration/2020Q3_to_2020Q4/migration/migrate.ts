"use strict";

import _ from "lodash";

import decrypt from "./decrypt";
import config from "config";
import Store from "./store";

import { Channel } from "./entities/channel";
import { DirectChannel } from "./entities/direct-channel";
import { ChannelTab } from "./entities/tab";
import { ChannelMember } from "./entities/channel-member";
import { UserChannel } from "./entities/user-channels";
import { ChannelMemberNotificationPreference } from "./entities/channel-member-notification-preferences";

let removedDirectChannels = 0;

const convertToUUIDv4 = (id: string) => {
  return id.toString().substring(0, 14) + "4" + id.toString().substring(14 + 1);
};

const configuration: any = {
  db: config.get("db"),
  encryption: config.get("encryption"),
};

const getUserCompanies = (userId: string) => {
  const client = Store.getCassandraClient();
  const query = `SELECT group_id FROM group_user WHERE user_id = ${userId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err: any, result: any) => {
      if (err || !result) reject(err);

      resolve(
        result.rows.map((g: any) => g?.group_id + "").filter((a: any) => a)
      );
    });
  });
};

const getNumberOfUsersInCompany = (companyId: string) => {
  const client = Store.getCassandraClient();
  const query = `SELECT member_count FROM group_entity WHERE id = ${companyId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err: any, result: any) => {
      if (err) console.log(err);

      if (!result) throw "Something went wrong in getting Channels";

      resolve({ id: companyId, numberOfUsers: result.rows[0].member_count });
    });
  });
};

/**
 * Get the old entity channel_member
 */

const getchannelMember = (channelId: string) => {
  const client = Store.getCassandraClient();
  const query = `SELECT * FROM channel_member WHERE channel_id = ${channelId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err: any, result: any) => {
      if (err) console.log(err);

      resolve(result.rows);
    });
  });
};

/**
 * Get the old entity channel_tab
 */

const getChannelTab = (channelId: string) => {
  const client = Store.getCassandraClient();
  const query = `SELECT * FROM channel_tab WHERE channel_id = ${channelId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err: any, result: any) => {
      if (err) console.log(err);

      resolve(result.rows);
    });
  });
};

const addChannelTabEntity = async (
  channelId: any,
  channelCompanyId: string,
  workspaceId: string
) => {
  const channelTabs: any = await getChannelTab(channelId);

  await Promise.all(
    channelTabs.map(async (channelTab: any) => {
      const decryptedTab: any = await decrypt(
        channelTab,
        configuration.encryption.key,
        configuration.encryption.defaultIv
      );

      const newChannelTab = new ChannelTab();
      _.assign(newChannelTab, {
        company_id: channelCompanyId,
        workspace_id: workspaceId,
        channel_id: convertToUUIDv4(decryptedTab.channel_id),
        id: decryptedTab.id,
        application_id: decryptedTab.app_id,
        col_order: "",
        configuration: JSON.parse(decryptedTab.configuration),
        name: decryptedTab.name,
        owner: "",
      });
      await (
        await Store.getOrmClient().getRepository("channel_tabs", ChannelTab)
      ).save(newChannelTab);
    })
  );
};

const addChannelEntity = async (
  channel: any,
  direct_channel_company_id: string
) => {
  const newChannel = new Channel();
  _.assign(newChannel, {
    company_id: channel.direct
      ? direct_channel_company_id
      : channel.original_group_id,
    workspace_id: channel.direct ? "direct" : channel.original_workspace_id,
    id: convertToUUIDv4(channel.id),
    archived: false,
    channel_group: channel.direct ? "" : channel.channel_group_name,
    connectors: JSON.parse(channel.connectors),
    description: channel.description,
    icon: channel.icon,
    is_default: false,
    name: channel.name,
    owner: "",
    visibility: channel.direct
      ? "direct"
      : channel.private
      ? "private"
      : "public",
    members: channel.direct ? channel.identifier.split("+") : [],
  });
  await (await Store.getOrmClient().getRepository("channels", Channel)).save(
    newChannel
  );

  if (channel.direct) {
    const newDirectChannel = new DirectChannel();
    _.assign(newDirectChannel, {
      company_id: direct_channel_company_id,
      users: channel.identifier.split("+").sort().join(","),
      channel_id: convertToUUIDv4(channel.id),
    });
    await (
      await Store.getOrmClient().getRepository("direct_channels", DirectChannel)
    ).save(newDirectChannel);
  }
};

const addChannelMembersEntities = async (
  channelId: any,
  directChannelCompanyId: any,
  workspaceId: any
) => {
  const preferences = ["all", "mentions", "me", "none"];
  const uuidVerficationRegex = /^(?:.*[-]){4}/;
  const channelMembers: any = await getchannelMember(channelId);

  for (const channelMember of channelMembers) {
    /*
      We check the user_id before the upsert after we have found some weird 
      strings instead of a uuid stored in the old database (ex: romaric@wanadoo.fr)
    */
    if (uuidVerficationRegex.test(channelMember.user_id)) {
      const newChannelMember = new ChannelMember();
      _.assign(newChannelMember, {
        company_id: directChannelCompanyId,
        workspace_id: workspaceId,
        channel_id: convertToUUIDv4(channelId),
        user_id: channelMember.user_id,
        type: "member",
      });

      await (
        await Store.getOrmClient().getRepository(
          "channel_members",
          ChannelMember
        )
      ).save(newChannelMember);

      const newUserChannel = new UserChannel();
      _.assign(newUserChannel, {
        company_id: directChannelCompanyId,
        workspace_id: workspaceId,
        user_id: channelMember.user_id,
        channel_id: convertToUUIDv4(channelId),
        expiration: 0,
        favorite: false,
        last_access: 0,
        last_increment: 0,
        notification_level:
          typeof channelMember.muted === "number"
            ? preferences[channelMember.muted]
            : "mentions",
        type: "member",
      });

      await (
        await Store.getOrmClient().getRepository("user_channels", UserChannel)
      ).save(newUserChannel);

      const newChannelMemberNotificationPreferences = new ChannelMemberNotificationPreference();
      _.assign(newChannelMemberNotificationPreferences, {
        company_id: directChannelCompanyId,
        channel_id: convertToUUIDv4(channelId),
        user_id: channelMember.user_id,
        last_read: 0,
        preferences:
          typeof channelMember.muted === "number"
            ? preferences[channelMember.muted]
            : "mentions",
      });

      await (
        await Store.getOrmClient().getRepository(
          "channel_members_notification_preferences",
          ChannelMemberNotificationPreference
        )
      ).save(newChannelMemberNotificationPreferences);
    }
  }
};

const getCompanyWithBigestNumberOfUsers = async (matchedCompanies: any) => {
  let companies = [];
  for (let group_id of matchedCompanies) {
    companies.push(await getNumberOfUsersInCompany(group_id));
  }
  companies = companies.map((c: any) => {
    c.numberOfUsers = c.numberOfUsers?.toNumber
      ? c.numberOfUsers?.toNumber()
      : 0;
    return c;
  });

  return companies.reduce((prev: any, current: any) =>
    prev.numberOfUsers > current.numberOfUsers ? prev : current
  );
};

const determinareCompanyId = async (channel: any) => {
  let directChannelCompanyId = "";
  let userCompanies: any = [];

  const channelMembers = Array.isArray(JSON.parse(channel.members))
    ? JSON.parse(channel.members)
    : Object.values(JSON.parse(channel.members) || {});

  if (!!channelMembers.length) {
    userCompanies = await Promise.all(
      channelMembers.map((userId: string) => getUserCompanies(userId))
    );

    const matchedCompanies = userCompanies.reduce((p: any, c: any) =>
      p.filter((e: any) => c.includes(e))
    );

    switch (true) {
      //Ignore if there's no matched companies
      case matchedCompanies.length === 1:
        directChannelCompanyId = matchedCompanies[0];
        break;
      case matchedCompanies.length > 1:
        const companyWithBigestNumberOfUsers: any = await getCompanyWithBigestNumberOfUsers(
          matchedCompanies
        );
        directChannelCompanyId = companyWithBigestNumberOfUsers.id;
        break;
    }
  }

  if (!directChannelCompanyId) {
    removedDirectChannels++;
  }

  return directChannelCompanyId;
};

/**
 * Channel importation root
 */

export const importChannel = async (channel: any) => {
  const decryptedChannel: any = await decrypt(
    channel,
    configuration.encryption.key,
    configuration.encryption.defaultIv
  );

  const workspaceId = decryptedChannel.direct
    ? "direct"
    : decryptedChannel.original_workspace_id;
  const directChannelCompanyId =
    workspaceId === "direct"
      ? await determinareCompanyId(decryptedChannel)
      : decryptedChannel.original_group_id;

  if ((!channel.name || !channel.icon) && workspaceId !== "direct") {
    return;
  }

  if (workspaceId === "direct" && !directChannelCompanyId) {
    return;
  }

  await addChannelEntity(decryptedChannel, directChannelCompanyId);
  await addChannelTabEntity(
    channel.id,
    directChannelCompanyId || decryptedChannel.original_group_id,
    workspaceId
  );

  if (
    workspaceId !== "direct" ||
    (decryptedChannel.last_activity &&
      new Date().getTime() -
        new Date(decryptedChannel.last_activity || 0).getTime() <
        1000 * 60 * 60 * 24 * 20)
  ) {
    await addChannelMembersEntities(
      channel.id,
      directChannelCompanyId,
      workspaceId
    );
  }
};
