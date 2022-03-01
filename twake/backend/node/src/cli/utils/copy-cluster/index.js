var cassandra = require("cassandra-driver");

var fromAuthProvider = new cassandra.auth.PlainTextAuthProvider("", "");
var fromContactPoints = [""];
var fromKeyspace = "twake";

var toAuthProvider = new cassandra.auth.PlainTextAuthProvider("", "");
var toContactPoints = [""];
var toKeyspace = "twake";

// -- start process

var fromClient = new cassandra.Client({
  localDataCenter: "datacenter1",
  contactPoints: fromContactPoints,
  authProvider: fromAuthProvider,
  keyspace: fromKeyspace,
});

var toClient = new cassandra.Client({
  localDataCenter: "datacenter1",
  contactPoints: toContactPoints,
  authProvider: toAuthProvider,
  keyspace: toKeyspace,
});

// -- Get all tables and copy schema

async function client(origin, query, parameters, options) {
  return await new Promise((resolve, reject) => {
    origin.execute(query, [], {}, function (err, result) {
      if (err) {
        reject({ err, result });
      } else {
        resolve(result);
      }
    });
  });
}

(async () => {
  const result = await client(
    fromClient,
    "SELECT table_name from system_schema.tables WHERE keyspace_name = '" + fromKeyspace + "'",
    [],
    {},
  );
  for (row of result.rows) {
    const fromTable = fromKeyspace + "." + row.table_name;
    const toTable = toKeyspace + "." + row.table_name;

    const fromResult = await client(fromClient, "SELECT count(*) from " + fromTable + "", [], {});
    const fromCount = fromResult.rows[0].count;

    try {
      const toResult = await client(toClient, "SELECT count(*) from " + toTable + "", [], {});
      const toCount = toResult.rows[0].count;
      console.log(fromTable.padEnd(50) + " | " + (toCount + "/" + fromCount).padEnd(20) + " | ");

      if (fromCount < toCount) {
        await new Promise(r => {
          fromClient.eachRow(
            "SELECT JSON * from " + fromTable,
            [],
            { prepare: true, fetchSize: 1000 },
            async function (n, row) {
              const json = row["[json]"];
              //TODO the prod table can have additional depreciated fields, we need to remove them
              await client(toClient, "INSERT INTO " + toTable + " JSON '" + json + "'", [], {});
            },
            function (err, result) {
              if (result && result.nextPage) {
                result.nextPage();
              } else {
                r();
              }
            },
          );
        });
      }
    } catch (err) {
      console.log(fromTable.padEnd(50) + " | " + ("error" + "/" + fromCount).padEnd(20) + " | ");
    }

    //TODO copy content
  }
})();
