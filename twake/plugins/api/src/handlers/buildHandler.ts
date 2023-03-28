import { Request, Response } from "express";
import { runCommand } from "./utils/runCommand";

export const buildPluginHandler = async (req: Request, res: Response) => {
  const { gitRepo } = req.body;

  if (!gitRepo) {
    return res.status(400).send("Missing required parameters");
  }

  try {
    await runCommand("build", [gitRepo]);
    res.send("Plugin built successfully");
  } catch (err:any) {
    res.status(500).send(`Error building plugin: ${err.message}`);
  }
};
