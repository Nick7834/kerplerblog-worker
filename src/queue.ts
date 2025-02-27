import { Queue } from 'bullmq'; 
import Redis from 'ioredis';   


export const redis = new Redis({
  host: 'humane-ibex-18467.upstash.io', 
  port: 6379,                            
  password: process.env.REDIS_PASSWORD, 
  maxRetriesPerRequest: null, 
  tls: { servername: 'humane-ibex-18467.upstash.io' },  
});


export const notificationQueue = new Queue('notification', {
    connection: redis,
  });
  