import { Queue, Worker } from "bullmq";
// import { exec } from "child_process"; // acts as a programmable terminal to execute the Python script in the background. It tells OS, "open a hidden terminal window, type python3 calculate_recommendations.py", then OS opens a new Python process.
import { execFile } from "child_process"; // instead of passing a raw string to a shell, execFile directly executes the target binary and passes the arguments as an array. Because no shell is ever spawned, malicious characters like && or ; are treated as literal strings rather than executable commands, rendering injection impossible.

const connection = {
  // environment variables from docker-compose
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

// initialized queue instance
// single queue can handle many different types of tasks, so named the task sent as 'update-recs'
export const recommendationsQueue = new Queue("recommendations", {
  connection,
});

// initialized a worker instance which constantly listens to the queue for any new jobs
const worker = new Worker(
  "recommendations",
  async (job) => {
    return new Promise((resolve, reject) => {
      console.log(`[Worker] Starting Python calculation for job ${job.id}`);

    // ---- with exec ----
    //   const command = `python3 ./scripts/calculate_recommendations.py`;

    //   exec(command, (error, stdout, stderr) => {
    //     if (error) {
    //       console.error(`[Worker Error]: ${error.message}`);
    //       return reject(error);
    //     }
    //     resolve(stdout);
    //   });
    // });

    // ---- with execFile ----
    // execFile takes the executable first, then an array of arguments
    execFile('python3', ['./scripts/calculate_recommendations.py'], (error, stdout, stderr) => {
      if (error) {
        console.error(`[Worker Error]: ${error.message}`);
        return reject(error);
      }
      resolve(stdout);
    });
  });
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed. Recommendations updated.`);
});
