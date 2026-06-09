import cron from "node-cron";
import { automatic_threads } from "@/scripts/automatic_threads.js";

// Run every day at midnight
export function startAutomaticThreadJob() {
    cron.schedule("0 0 * * *", async () => {
    console.log("Running automatic thread generation...");

    try {
        await automatic_threads();
        console.log("Threads created successfully");
    } catch (err) {
        console.error("Error creating threads:", err);
    }
  });
}