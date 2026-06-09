import { automatic_threads } from "../automatic_threads.js";

automatic_threads()
  .then(() => console.log("Generated threads"))
  .catch(console.error);