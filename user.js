import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000 // 5 seconds
});
const dbName = process.env.DB_NAME;

await client.connect();
const db = client.db(dbName);

export async function update_chat_data(req, res) {
    try {
        const username = req.query.username;
        const chatMessage = req.query.chat;

        await db.collection('chat_data').updateOne(
            { username: username },
            {
                $push: { chat: chatMessage }
            },
            { upsert: true }
        );

        res.send({ 'message': "Chat data updated successfully!" });
    } catch (e) {
        console.log(e);
        res.send({ 'message': JSON.stringify(e) });
    }
}

export async function get_chat_data(req, res) {
    try {
        const username = req.query.username;
        const chatData = await db.collection('chat_data').findOne(
            { username: username },
            { projection: { chat: 1, _id: 0 } }
        );

        if (chatData) {
            res.send({ 'chat': chatData.chat });
        } else {
            res.send({ 'message': "No chat data found for this user." });
        }
    } catch (e) {
        console.log(e);
        res.send({ 'message': JSON.stringify(e) });
    }
}
