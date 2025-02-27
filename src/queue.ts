import { Redis } from "ioredis";
import { Queue } from "bullmq";

export const redis = new Redis(process.env.REDIS_URL!);

export const notificationQueue = new Queue("notification", {
  connection: {
    host: new URL(process.env.REDIS_URL!).hostname,
    port: Number(new URL(process.env.REDIS_URL!).port),
    password: new URL(process.env.REDIS_URL!).password,
    tls: { rejectUnauthorized: false },
  },
  defaultJobOptions: {
    removeOnComplete: true, 
    removeOnFail: true, 
  },
});