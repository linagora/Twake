import { Request, Response } from "express";
import { runCommand } from "./utils/runCommand";

export const startPluginHandler = async (req: Request, res: Response) => {
  try {
    await runCommand("start", []);
    res.send("Plugins started successfully");
  } catch (err:any) {
    res.status(500).send(`Error starting plugins: ${err.message}`);
  }
};
