"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pusher = void 0;
const bullmq_1 = require("bullmq");
const prisma_client_1 = require("./prisma/prisma-client");
const queue_1 = require("./queue");
const lodash_chunk_1 = __importDefault(require("lodash.chunk"));
const pusher_1 = __importDefault(require("pusher"));
exports.pusher = new pusher_1.default({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true
});
const CHUNK_SIZE = 1000;
new bullmq_1.Worker('notification', (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, userName, avatarUser, newPostId, title, photoUrls } = job.data;
    const followers = yield prisma_client_1.prisma.follower.findMany({
        where: { followingId: userId },
        select: { followerId: true },
    });
    const followingIds = followers.map((f) => f.followerId);
    const chunks = (0, lodash_chunk_1.default)(followingIds, CHUNK_SIZE);
    for (const chunk of chunks) {
        const createdNotifications = yield Promise.all(chunk.map((id) => prisma_client_1.prisma.notification.create({
            data: {
                userId: id,
                type: 'post',
                postId: newPostId,
                message: `User "${userName.charAt(0).toUpperCase() + userName.slice(1)}"
                        has posted a new post: "${title.charAt(0).toUpperCase() + title.slice(1)}"`,
                avatar: avatarUser,
                postImage: photoUrls.length > 0 ? photoUrls[0] : null,
            },
            select: { id: true, userId: true },
        })));
        exports.pusher.triggerBatch(createdNotifications.map((notification) => ({
            channel: `user-${notification.userId}`,
            name: 'new_notification',
            data: {
                id: notification.id,
                message: `User "${userName.charAt(0).toUpperCase() + userName.slice(1)}"
                      has posted a new post: "${title.charAt(0).toUpperCase() + title.slice(1)}"`,
                postId: newPostId,
                avatar: avatarUser,
                isRead: false,
                type: 'post',
                postImage: photoUrls.length > 0 ? photoUrls[0] : null,
            },
        })));
    }
}), { connection: queue_1.redis });
