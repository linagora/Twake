import { Request, Response } from "express";
import { runCommand } from "./utils/runCommand";

export const addPluginHandler = async (req: Request, res: Response) => {
  const { gitRepo, pluginId, pluginSecret, envVar } = req.body;

  if (!gitRepo || !pluginId || !pluginSecret) {
    return res.status(400).send("Missing required parameters");
  }

  try {
    await runCommand("add", [gitRepo, pluginId, pluginSecret, envVar]);
    res.send("Plugin added successfully");
  } catch (err:any) {
    console.error(err);
    res.status(500).send("Error adding plugin");
  }
};
