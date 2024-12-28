export class RedisService {
  private store: Map<string, string> = new Map();

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
}
