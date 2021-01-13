"use strict";

const cassandra = require("cassandra-driver");
const decrypt = require("./decrypt.js");

const client = new cassandra.Client({
  contactPoints: ["127.0.0.1"],
  localDataCenter: "datacenter1",
  keyspace: "twake",
  wait: false,
  retries: 10,
  delay: 200,
});

const decryptChannels = async (channels, key, defaultIv) => {
  return Promise.all(
    channels.map(async (channel) => decrypt(channel, key, defaultIv))
  );
};

const getchannels = () => {
  const query = "SELECT * FROM channel ";

  return new Promise((resolve, reject) => {
    client.execute(query, (err, result) => {
      if (err) reject(err);

      resolve(result.rows);

      client.shutdown();
    });
  });
};

const init = async (configuration) => {
  //TODO: store the configuration somewhere and use it

  //Test
  console.log(
    await decrypt(
      ["hello"],
      configuration.encryption.key,
      configuration.encryption.defaultIv
    )
  );

  //
  getchannels()
    .then((channels) =>
      decryptChannels(
        channels,
        configuration.encryption.key,
        configuration.encryption.defaultIv
      )
    )
    .then((res) => console.log(res));
};

module.exports = init;

// const getChannelMembers = () => {
//   const query = "SELECT * FROM channel_member";

//   client.execute(query, (err, result) => {
//     if (err) return console.log("ERROR!!!", err);

//     console.log(result.rows);

//     client.shutdown();
//   });
// };

/*

Cold migration: offline (No dual Writes)
1. Migrating schema
2. Forklifting existing data
3. Validation
4. Cut-over; fading off the old to the new system

 We need to ignore:
 Channels that are application channels (anything with a .app_id != null)
 Channels that have messages_increment == 0
*/

/*
  ChannelType = {
    company_id 
    workspace_id <=== original_workspace_id
    type <=== direct? "direct" : "workspace"
    id <=== id
    icon <=== icon
    name <=== name
    description <=== description
    channel_group <=== channel_group_name
    visibility <=== private ? ("private" | "public" | "direct")
    default <=== What to choose by default?
    direct_channel_members <=== members
    owner
    members_count <=== members_count
    guests_count <=== ext_members
    messages_count <=== messages_count
    archived
    archivation_date
    user_member
    connectors <=== connectors
  }
  */
