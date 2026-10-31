import Redis from 'ioredis';

export class RedisPubSubManager {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected = false;

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL;
    if (!url) {
      console.log('[RedisPubSub] No REDIS_URL provided. Operating in single-node in-memory mode.');
      return;
    }

    try {
      this.publisher = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't loop endlessly if redis is offline locally
      });

      this.subscriber = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      this.publisher.on('error', (err) => {
        // Silently catch Redis errors when offline locally
        if (this.isConnected) {
          console.warn('[RedisPubSub] Publisher connection lost:', err.message);
          this.isConnected = false;
        }
      });

      this.subscriber.on('error', (err) => {
        if (this.isConnected) {
          console.warn('[RedisPubSub] Subscriber connection lost:', err.message);
          this.isConnected = false;
        }
      });
    } catch (e: any) {
      console.warn('[RedisPubSub] Failed to initialize Redis client:', e.message);
    }
  }

  async connect(): Promise<boolean> {
    if (!this.publisher || !this.subscriber) return false;
    try {
      await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
      this.isConnected = true;
      console.log('[RedisPubSub] Connected to Redis cluster successfully.');
      return true;
    } catch {
      console.log('[RedisPubSub] Redis not available at specified URL. Operating in standalone mode.');
      this.isConnected = false;
      return false;
    }
  }

  async publishUpdate(roomName: string, update: Uint8Array): Promise<void> {
    if (!this.isConnected || !this.publisher) return;
    try {
      const buffer = Buffer.from(update);
      await this.publisher.publish(`collab:room:${roomName}`, buffer);
    } catch (e: any) {
      console.error('[RedisPubSub] Publish error:', e.message);
    }
  }

  async subscribeToRoom(roomName: string, onUpdate: (update: Uint8Array) => void): Promise<void> {
    if (!this.isConnected || !this.subscriber) return;
    const channel = `collab:room:${roomName}`;
    await this.subscriber.subscribe(channel);
    this.subscriber.on('messageBuffer', (chan, message) => {
      if (chan.toString() === channel) {
        onUpdate(new Uint8Array(message));
      }
    });
  }

  get status(): { connected: boolean } {
    return { connected: this.isConnected };
  }
}
