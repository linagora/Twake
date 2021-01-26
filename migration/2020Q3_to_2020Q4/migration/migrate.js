"use strict";

import cassandra from "cassandra-driver";
import decrypt from "./decrypt.js";
import config from "config";

import DatabaseServiceClass from "./services/db/index";
const databaseService = new DatabaseServiceClass("cassandra", {
  ...config.get("db"),
});

let channels_counter = 0;

const configuration = {
  db: config.get("db"),
  encryption: config.get("encryption"),
};

const getUserCompanies = (userId) => {
  const query = `SELECT group_id FROM group_user WHERE user_id = ${userId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err, result) => {
      if (err || !result) reject(err);

      resolve(result.rows);
    });
  });
};

const getNumberOfUsersInCompany = (companyId) => {
  const query = `SELECT member_count FROM group_entity WHERE id = ${companyId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err, result) => {
      if (err) console.log(err);

      if (!result) throw "Something went wrong in getting Channels";

      resolve({ id: companyId, numberOfUsers: result.rows[0].member_count });
    });
  });
};

const addChannelEntity = async (channel, direct_channel_company_id) => {
  let newChannel = {};

  // Store in channels
  newChannel = {
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
  };

  // Store it in Direct channels
  if (channel.direct) {
    newChannel = {
      company_id: direct_channel_company_id,
      users: channel.identifier.split("+").sort().join(","),
      channel_id: channel.id,
    };
  }
};

const getCompanyWithBigestNumberOfUsers = async (matchedCompanies) => {
  const companies = await Promise.all(
    matchedCompanies.map(({ group_id }) => getNumberOfUsersInCompany(group_id))
  );

  return companies.reduce((prev, current) =>
    prev.numberOfUsers > current.numberOfUsers ? prev : current
  );
};

const determinareCompanyId = async (channel) => {
  let directChannelCompanyId = "";
  let userCompanies = [];

  const _fillCompanyId = async (matchedCompanies) => {
    switch (true) {
      case !matchedCompanies.length:
        //delete channel
        break;
      case matchedCompanies.length === 1:
        directChannelCompanyId = matchedCompanies[0].group_id;
        break;
      case matchedCompanies.length > 1:
        const companyWithBigestNumberOfUsers = await getCompanyWithBigestNumberOfUsers(
          matchedCompanies
        );
        directChannelCompanyId = companyWithBigestNumberOfUsers.id;
        break;
    }
  };

  // Todo: handle the case when channel.member is an object

  if (!!JSON.parse(channel.members).length) {
    userCompanies = await Promise.all(
      JSON.parse(channel.members).map((userId) => getUserCompanies(userId))
    );

    const matchedCompanies = userCompanies.shift().filter((v) => {
      return userCompanies.every((company) => {
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

const importChannel = async (channel) => {
  const decryptedChannel = await decrypt(
    channel,
    configuration.encryption.key,
    configuration.encryption.defaultIv
  );

  const directChannelCompanyId = await determinareCompanyId(decryptedChannel);

  await addChannelEntity(decryptedChannel, directChannelCompanyId);

  console.log("ended", directChannelCompanyId + "");
};

/**
 * Main channels loop
 */

const getChannels = async (pageState = undefined) => {
  const query = "SELECT * FROM channel";

  return new Promise((resolve, reject) => {
    client.execute(
      query,
      (err, result) => {
        if (err || !result) {
          console.log(err);
          resolve({ rows: [], pageState: pageState });
        }

        if (!result) throw "Something went wrong in getting Channels";

        resolve({ rows: result.rows, pageState: result.pageState });
      },
      { pageState, fetchSize: 500 }
    );
  });
};

let client;

const init = async () => {
  await databaseService.getConnector().init();

  let pageState;
  while (true) {
    client = new cassandra.Client({
      contactPoints: configuration.db.contactPoints, //["172.17.0.1:9042"]
      localDataCenter: configuration.db.localDataCenter,
      keyspace: configuration.db.keyspace,
      wait: false,
      retries: 10,
      delay: 200,
    });

    const result = await getChannels(pageState);
    await Promise.all(result.rows.map((channel) => importChannel(channel)));
    // if (
    //   result &&
    //   result.rows &&
    //   result.rows.length > 0 &&
    //   result.pageState != pageState
    // ) {
    //   await Promise.all(
    //     result.rows.map((channel) => {
    //       try {
    //         return importChannel(channel);
    //       } catch (err) {
    //         console.log("Channel import error: ", err);
    //       }
    //       return new Promise((resolve) => resolve());
    //     })
    //   );
    //   channels_counter += result.rows.length;
    //   console.log(channels_counter);
    // } else {
    //   break;
    // }
    client.shutdown();

    await new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, 5000)
    );

    pageState = result.pageState;
  }
  // console.log("> Ended with ", channels_counter, " channels migrated.");
};

export default init;
