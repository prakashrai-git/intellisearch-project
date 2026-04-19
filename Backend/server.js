import Express from "express";
import Cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { get_chat_data, update_chat_data } from "./user.js";

dotenv.config();

const port = process.env.PORT || 5001;
const server = Express();

server.use(Cors({
    origin: [process.env.CLIENT_ORIGIN_1, process.env.CLIENT_ORIGIN_2],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
server.use(bodyParser.json({ limit: '10mb' }));
server.use(cookieParser());

// Changed update_chat_data to POST method
server.post('/api/update_chat_data', update_chat_data);
server.get('/api/get_chat_data', get_chat_data);

server.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});