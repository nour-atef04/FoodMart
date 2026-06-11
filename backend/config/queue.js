import { Queue, Worker } from 'bullmq';
import { exec } from "child_process";

const connection = {
  // environment variables from docker-compose
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

export const recommendationsQueue = new Queue('recommendations', { connection });

const worker = new Worker('recommendations', async job => {
  return new Promise((resolve, reject) => {
    console.log(`[Worker] Starting Python calculation for job ${job.id}`);
    
    const command = `python3 ./scripts/calculate_recommendations.py`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Worker Error]: ${error.message}`);
        return reject(error);
      }
      resolve(stdout);
    });
  });
}, { connection });

worker.on('completed', job => {
  console.log(`[Worker] Job ${job.id} completed. Recommendations updated.`);
});