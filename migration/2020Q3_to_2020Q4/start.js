"use strict";

const configuration = {
  encryption: {
    key: "c9a17eab88ab63bb3e90c027196a89776651a7c06651a7c0",
    defaultIv: "twake_constantiv",
  },
  db: {
    contactPoints: ["127.0.0.1"],
    localDataCenter: "datacenter1",
    keyspace: "twake",
  },
};

const migration = require("./migration/migrate.js");
migration(configuration);
