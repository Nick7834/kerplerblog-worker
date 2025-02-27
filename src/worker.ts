import { Worker } from 'bullmq';
import { prisma } from './prisma/prisma-client';
import { redis } from './queue';
import chunk from 'lodash.chunk';
import Pusher from 'pusher'; 

export const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true
  });

const CHUNK_SIZE = 1000;

new Worker('notification', async (job) => {
    const { userId, userName, avatarUser, newPostId, title, photoUrls } = job.data;
  
    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
  
    const followingIds = followers.map((f: { followerId: string; }) => f.followerId);
    const chunks = chunk(followingIds, CHUNK_SIZE);
  
    for (const chunk of chunks) {
      const createdNotifications = await Promise.all(
        chunk.map((id) =>
          prisma.notification.create({
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
          })
        )
      );
  
      pusher.triggerBatch(
        createdNotifications.map((notification) => ({
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
        }))
      );
    }
  }, { connection: redis });
  