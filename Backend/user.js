import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME);
  }
  return db;
}

export async function update_chat_data(req, res) {
  try {
    const { username, chat } = req.body;
    
    if (!username || !chat) {
      return res.status(400).send({ error: "Username and chat are required" });
    }
    
    const db = await connectDB();

    await db.collection('chat_data').updateOne(
      { username },
      {
        $push: {
          chat: {
            message: chat,
            timestamp: new Date()
          }
        }
      },
      { upsert: true }
    );

    res.send({ message: "Chat data updated successfully!" });
  } catch (e) {
    console.error("Error updating chat data:", e);
    res.status(500).send({ error: e.message });
  }
}

export async function get_chat_data(req, res) {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).send({ error: "Username is required" });
    }
    
    const db = await connectDB();

    const chatData = await db.collection('chat_data').findOne(
      { username },
      { projection: { chat: 1, _id: 0 } }
    );

    res.send(chatData || { chat: [] });
  } catch (e) {
    console.error("Error getting chat data:", e);
    res.status(500).send({ error: e.message });
  }
}