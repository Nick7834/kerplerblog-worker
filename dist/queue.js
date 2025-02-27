"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = exports.redis = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.redis = new ioredis_1.default({
    host: 'humane-ibex-18467.upstash.io',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    tls: { servername: 'humane-ibex-18467.upstash.io' },
});
exports.notificationQueue = new bullmq_1.Queue('notification', {
    connection: exports.redis,
});
