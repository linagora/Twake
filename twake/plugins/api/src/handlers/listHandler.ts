import { Request, Response } from "express";
import { runCommand } from "./utils/runCommand";

export const listPluginHandler = async (req: Request, res: Response) => {
    try {
      const output = await runCommand("list", []);
      res.send(output);
    } catch (err:any) {
      res.status(500).send(`Error listing plugins: ${err.message}`);
    }
  }