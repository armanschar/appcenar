import { projectRoot } from "../utils/Paths.js";
import path from "path";
import dotenv from "dotenv";

const envFilePath = path.join(
  projectRoot,
  `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ``}`
);

dotenv.config({path: envFilePath});
