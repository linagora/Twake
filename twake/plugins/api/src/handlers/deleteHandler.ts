import { Request, Response } from "express";
import { runCommand } from "./utils/runCommand";

export const deletePluginHandler = async (req: Request, res: Response) => {
    const pluginName = req.params.pluginName;
  
    try {
      await runCommand("delete", [pluginName]);
      res.send(`Plugin ${pluginName} deleted successfully`);
    } catch (err:any) {
      res.status(500).send(`Error deleting plugin ${pluginName}: ${err.message}`);
    }
  }
