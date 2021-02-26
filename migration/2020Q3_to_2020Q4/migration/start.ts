import { importChannel } from "./migrate.js";
import Store from "./store";

/**
 * Main channels loop
 */

const getChannels = async (pageState: any = undefined) => {
  const query = "SELECT * FROM channel";

  return new Promise((resolve, reject) => {
    const client = Store.getCassandraClient();
    client.execute(
      query,
      (err: any, result: any) => {
        if (err || !result) {
          console.log(err);
          resolve({ rows: [], pageState: pageState });
        }

        if (!result) throw "Something went wrong in getting Channels";

        resolve({ rows: result.rows, pageState: result.pageState });
      },
      { pageState, fetchSize: 100 }
    );
  });
};

let channels_counter = 0;

const init = async () => {
  await Store.initOrmClient();

  let pageState;
  while (true) {
    await Store.initCassandraClient();
    let client = Store.getCassandraClient();

    const channels: any = await getChannels(pageState);
    if (channels && channels.rows && channels.rows.length > 0) {
      for (let channel of channels.rows) {
        try {
          process.stdout.write("|");
          await importChannel(channel);
        } catch (err) {
          console.log("Channel import error: ", channel, err);
        }
      }
      channels_counter += channels.rows.length;
      console.log("Imported channels: ", channels_counter);
    } else {
      client.shutdown();
      break;
    }

    client.shutdown();

    if (!channels.pageState) {
      break;
    }

    await new Promise((resolve) =>
      setTimeout(() => {
        resolve("");
      }, 500)
    );

    pageState = channels.pageState;
  }
  console.log("> Ended with ", channels_counter, " channels migrated.");

  return "ok";
};

init().then(console.log).catch(console.error);
