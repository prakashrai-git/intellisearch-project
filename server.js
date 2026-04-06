import Express from "express";
import Cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { get_chat_data, update_chat_data } from "./user.js";

dotenv.config(); // Load environment variables

const port = process.env.PORT || 5000; // Default to 5000 if not set in .env
const server = Express();

server.use(Cors({
    origin: [process.env.CLIENT_ORIGIN_1, process.env.CLIENT_ORIGIN_2],
    credentials: true
}));
server.use(bodyParser.json({ limit: '10mb' }));
server.use(cookieParser());

server.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});

server.get('/update_chat_data', update_chat_data);
server.get('/get_chat_data', get_chat_data);
