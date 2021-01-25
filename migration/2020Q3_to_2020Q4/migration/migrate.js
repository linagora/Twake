"use strict";

const cassandra = require("cassandra-driver");
const decrypt = require("./decrypt.js");
const config = require("config");

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

      // client.shutdown();
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

      // client.shutdown();
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

  // Math.max.apply(Math, companies.map(company => company.numberOfUsers))
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

    _fillCompanyId(matchedCompanies);
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

let client = new cassandra.Client({
  contactPoints: configuration.db.contactPoints, //["172.17.0.1:9042"]
  localDataCenter: configuration.db.localDataCenter,
  keyspace: configuration.db.keyspace,
  wait: false,
  retries: 10,
  delay: 200,
});

const init = async () => {
  let pageState;
  while (true) {
    const result = await getChannels(pageState);
    if (
      result &&
      result.rows &&
      result.rows.length > 0 &&
      result.pageState != pageState
    ) {
      await Promise.all(
        result.rows.map(async (channel) => {
          try {
            await importChannel(channel);
          } catch (err) {
            console.log("Channel import error: ", err);
          }
        })
      );
      channels_counter += result.rows.length;
      console.log(channels_counter);
    } else {
      break;
    }

    pageState = result.pageState;
  }
  console.log("> Ended with ", channels_counter, " channels migrated.");
};

module.exports = init;
