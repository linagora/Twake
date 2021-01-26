import { importChannel } from "./migrate.js";
import Store from "./store";

/**
 * Main channels loop
 */

const getChannels = async (pageState: any = undefined) => {
  const query = "SELECT * FROM channel";

  return new Promise((resolve, reject) => {
    let client = Store.getCassandraClient();
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
      { pageState, fetchSize: 500 }
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

    const result: any = await getChannels(pageState);
    if (
      result &&
      result.rows &&
      result.rows.length > 0 &&
      result.pageState != pageState
    ) {
      await Promise.all(
        result.rows.map((channel: any) => {
          try {
            return importChannel(channel);
          } catch (err) {
            console.log("Channel import error: ", err);
          }
          return new Promise((resolve) => resolve(""));
        })
      );
      channels_counter += result.rows.length;
      console.log("Imported: ", channels_counter);
    } else {
      break;
    }
    client.shutdown();

    await new Promise((resolve) =>
      setTimeout(() => {
        resolve("");
      }, 5000)
    );

    pageState = result.pageState;
  }
  console.log("> Ended with ", channels_counter, " channels migrated.");
};

init();
