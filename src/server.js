import express from "express";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable } from "./db/schema.js";
import { eq, and } from "drizzle-orm";
import job from "./config/cron.js";


const PORT =ENV.PORT || 8001;
const app = express()


if ((ENV.NODE_ENV) ==="production") job.start();
app.use(express.json());

app.get("/api/health", (req,res) => {
    res.status(200).json({success: true})
});

app.post("/api/favorites", async (req, res) => {
    try {
        const {userId, receipeId, title, image, cookTime, servings } = req.body;

        if (!userId || !receipeId|| !title ){
            return res.json(400).json({ error: "missing required fields!"})
        }

        const newFavorite = await db.insert(favoritesTable).values({
            userId,
            receipeId,
            title,
            image,
            cookTime,
            servings,
        }).returning();

        res.status(201).json(newFavorite[0])
    } catch (error) {
        console.log("Error adding favorite", error);
        res.status(500).json({error:"internal error"});
    }
});

app.delete("/api/favorites/:userId/:receipeId", async (req, res) => {
    try {
        const {userId, receipeId} = req.params

        await db.delete(favoritesTable).where(
            and(eq(favoritesTable.userId,userId), eq(favoritesTable.receipeId,parseInt(receipeId)))
        );

        res.status(201).json({message: "favorite removed successfully"});
    } catch (error) {
        console.log("Error removing favorite", error);
        res.status(500).json({error:"internal error"});
    }
});

app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const userFavorites = await db.select().from(favoritesTable).where(eq(favoritesTable.userId,userId))
        res.status(200).json(userFavorites);
    } catch (error) {
        console.log("Error fetching favorite", error);
        res.status(500).json({error:"internal error"});
    }
})

app.listen(PORT, ()=>{
    console.log("server is running on port :", PORT);
})