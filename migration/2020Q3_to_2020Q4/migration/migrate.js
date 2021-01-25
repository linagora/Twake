"use strict";

const cassandra = require("cassandra-driver");
const decrypt = require("./decrypt.js");
const config = require("config");

const configuration = {
  db: config.get("db"),
  encryption: config.get("encryption"),
};

const client = new cassandra.Client({
  contactPoints: configuration.db.contactPoints, //["172.17.0.1:9042"]
  localDataCenter: configuration.db.localDataCenter,
  keyspace: configuration.db.keyspace,
  wait: false,
  retries: 10,
  delay: 200,
});

const getChannels = () => {
  const query = "SELECT * FROM channel";

  return new Promise((resolve, reject) => {
    client.execute(query, (err, result) => {
      if (err) console.log(err);

      if (!result) throw "Something went wrong in getting Channels";

      resolve(result.rows);

      // client.shutdown();
    });
  });
};

const getUserCompanies = (userId) => {
  const query = `SELECT group_id FROM group_user WHERE user_id = ${userId}`;

  return new Promise((resolve, reject) => {
    client.execute(query, (err, result) => {
      if (err) console.log(err);

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

      resolve({ companyId, numberOfUsers: result.rows[0].member_count });

      // client.shutdown();
    });
  });
};

const addChannelEntity = (channel, direct_channel_company_id) => {
  let newChannel = {};

  // Store in channels
  newChannel = {
    company_id: channel.original_group_id,
    workspace_id: channel.direct ? "direct" : channel.original_workspace_id,
    id: channel.id,
    archived: false,
    channel_group: channel.direct
      ? direct_channel_company_id
      : channel.channel_group_name, // pass it in prams!
    connectors: channel.connectors, //json.decode?? parse
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

  // console.log(newChannel);
};

const getCompanyWithBigestNumberOfUsers = async (matchedCompanies) => {
  const companies = await Promise.all(
    matchedCompanies.map(({ group_id }) => getNumberOfUsersInCompany(group_id))
  );

  /*
  [
    {
      companyId: TimeUuid: 5bae5ba6-f409-11ea-919a-0242ac120006,
      numberOfUsers: Long: 0 
    },
    {
      companyId: TimeUuid: 6a938522-f640-11ea-b92e-0242ac120006,
      numberOfUsers: Long: 1
    }
  ]
  */
};

const determinareCompanyId = async (channel) => {
  let directChannelCompanyId = "";
  let userCompanies = [];

  const _fillCompanyId = async (matchedCompanies) => {
    switch (true) {
      case !matchedCompanies.length:
        //delete channel
        // console.log("Delete");
        break;
      case matchedCompanies.length === 1:
        // console.log(matchedCompanies[0].group_id);
        // directChannelCompanyId = matchedCompanies[0]
        break;
      case matchedCompanies.length > 1:
        await getCompanyWithBigestNumberOfUsers(matchedCompanies);
        // console.log("222222222222222222");
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

  // console.log(userCompanies);
};

const importChannel = async (channel) => {
  const decryptedChannel = await decrypt(
    channel,
    configuration.encryption.key,
    configuration.encryption.defaultIv
  );

  // Determinate a company id: direct_channel_company_id
  const directChannelCompanyId = determinareCompanyId(decryptedChannel);

  // addChannelEntity(decryptedChannel, "direct_channel_company_id");
};

const init = () => {
  getChannels().then((channels) =>
    Promise.all(channels.map(async (channel) => importChannel(channel)))
  );
};

module.exports = init;
