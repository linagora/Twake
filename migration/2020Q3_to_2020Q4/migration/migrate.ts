"use strict";

import decrypt from "./decrypt";
import config from "config";
import Store from "./store";
import { Channel } from "./entities/channel";
import _ from "lodash";
import { DirectChannel } from "./entities/direct-channel";

const configuration: any = {
  db: config.get("db"),
  encryption: config.get("encryption"),
};

const getUserCompanies = (userId: string) => {
  let client = Store.getCassandraClient();

  const query = `SELECT group_id FROM group_user WHERE user_id = ${userId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err: any, result: any) => {
      if (err || !result) reject(err);

      resolve(result.rows);
    });
  });
};

const getNumberOfUsersInCompany = (companyId: string) => {
  let client = Store.getCassandraClient();

  const query = `SELECT member_count FROM group_entity WHERE id = ${companyId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err: any, result: any) => {
      if (err) console.log(err);

      if (!result) throw "Something went wrong in getting Channels";

      resolve({ id: companyId, numberOfUsers: result.rows[0].member_count });
    });
  });
};

const addChannelEntity = async (
  channel: any,
  direct_channel_company_id: string
) => {
  const newChannel = new Channel();
  _.assign(newChannel, {
    company_id: channel.original_group_id,
    workspace_id: channel.direct ? "direct" : channel.original_workspace_id,
    id: channel.id,
    archived: false,
    channel_group: channel.direct
      ? direct_channel_company_id
      : channel.channel_group_name,
    connectors: JSON.parse(channel.connectors),
    description: channel.description,
    icon: channel.icon,
    is_default: true,
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

  // Store it in Direct channels
  if (channel.direct) {
    const newDirectChannel = new DirectChannel();
    _.assign(newDirectChannel, {
      company_id: direct_channel_company_id,
      users: channel.identifier.split("+").sort().join(","),
      channel_id: channel.id,
    });
    await (
      await Store.getOrmClient().getRepository("direct_channels", DirectChannel)
    ).save(newDirectChannel);
  }
};

const getCompanyWithBigestNumberOfUsers = async (matchedCompanies: any) => {
  const companies = await Promise.all(
    matchedCompanies.map(({ group_id }: { group_id: any }) =>
      getNumberOfUsersInCompany(group_id)
    )
  );

  return companies.reduce((prev: any, current: any) =>
    prev.numberOfUsers > current.numberOfUsers ? prev : current
  );
};

const determinareCompanyId = async (channel: any) => {
  let directChannelCompanyId = "";
  let userCompanies: any = [];

  const _fillCompanyId = async (matchedCompanies: any) => {
    switch (true) {
      case !matchedCompanies.length:
        //delete channel
        break;
      case matchedCompanies.length === 1:
        directChannelCompanyId = matchedCompanies[0].group_id;
        break;
      case matchedCompanies.length > 1:
        const companyWithBigestNumberOfUsers: any = await getCompanyWithBigestNumberOfUsers(
          matchedCompanies
        );
        directChannelCompanyId = companyWithBigestNumberOfUsers.id;
        break;
    }
  };

  // Todo: handle the case when channel.member is an object

  if (!!JSON.parse(channel.members).length) {
    userCompanies = await Promise.all(
      JSON.parse(channel.members).map((userId: string) =>
        getUserCompanies(userId)
      )
    );

    const matchedCompanies = userCompanies.shift().filter((v: any) => {
      return userCompanies.every((company: any) => {
        return company.indexOf(v) !== -1;
      });
    });

    await _fillCompanyId(matchedCompanies);
  }

  return directChannelCompanyId;
};

/**
 * Channel importation root
 */

export const importChannel = async (channel: any) => {
  const decryptedChannel = await decrypt(
    channel,
    configuration.encryption.key,
    configuration.encryption.defaultIv
  );

  const directChannelCompanyId = await determinareCompanyId(decryptedChannel);

  await addChannelEntity(decryptedChannel, directChannelCompanyId);
};
