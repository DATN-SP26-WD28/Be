import express from "express";
import connectDB from "./src/shared/configs/connectDB.js";
import notFoundRequest from "./src/shared/middlewares/notFoundRequest.js";
import { HOST, PORT } from "./src/shared/configs/dotenvConfig.js";
import router from "./src/routes/index.js";
import dotenv from "dotenv"

const app = express();
app.use(express.json());

connectDB();

app.use("/", router);

// * handle Notfound Request
app.use(notFoundRequest);

app.listen(PORT, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});
