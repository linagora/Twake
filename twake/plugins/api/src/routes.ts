import express from "express";
import {
  addPluginHandler,
  startPluginHandler,
  buildPluginHandler,
  updatePluginHandler,
  deletePluginHandler,
  listPluginHandler,
} from "./handlers/";

const router = express.Router();

router.post("/add", addPluginHandler);

router.post("/start", startPluginHandler);

router.post("/build", buildPluginHandler);

router.post("/update/:pluginName", updatePluginHandler);

router.post("/delete/:pluginName", deletePluginHandler);

router.get("/list", listPluginHandler);

export default router;
