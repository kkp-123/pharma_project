import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dburl = process.env.DB_URL


mongoose.connect(dburl)

const db = mongoose.connection;

db.on('connected' , () => {
    console.log("database Connected sucessfully")
})
db.on('error' , (err) => {
    console.log("mongodb connection error",err)
})
db.on('disconnected' , () => {
    console.log("mongodb disconnected")
})

export default db;

