import { Request, Response } from "express";
import { runCommand } from "./utils/runCommand";

export const updatePluginHandler = async (req: Request, res: Response) => {
    const pluginName = req.params.pluginName;
  
    try {
      await runCommand("update", [pluginName]);
      res.send(`Plugin ${pluginName} updated successfully`);
    } catch (err:any) {
      res.status(500).send(`Error updating plugin ${pluginName}: ${err.message}`);
    }
  }
