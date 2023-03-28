import express from "express";
import bodyParser from "body-parser";
import pluginRoutes from "./routes";

const app = express();

app.use(bodyParser.json());

app.use("/api", pluginRoutes);

const port = process.env.PORT || 6000;

app.listen(port, () => {
  console.log(`Listening on port ${port} 🚀`);
});
