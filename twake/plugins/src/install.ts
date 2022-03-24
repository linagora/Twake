import { argv, exit } from "process";
import config from "./config";
import { download } from "./utils/download-git";
import { v4 } from "uuid";
import { rmdirSync } from "fs";

export const install = (pluginLocation: string) => {
  //Install an app on the Twake server and here using a folder / git repository
  console.log("Will install the plugin: ", pluginLocation);

  const tempId = v4();
  const tempLocation = "./plugins-download/" + tempId;

  // Download git repository or copy content of folder
  download(pluginLocation, tempLocation, { clone: true }, (err: any) => {
    console.log("Finished download plugin in ", tempLocation, err);
    rmdirSync(tempLocation, { recursive: true });
    exit();
  });

  //TODO 2. create / update the app on the Twake server
  //TODO 3. Update the ports map of each locally running plugins
};

install(argv[2]);
