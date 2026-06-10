import { dbQuery, hasDatabase } from './db.js';

interface CachedResponse {
  query: string;
  response: string;
  embedding?: number[];
  similarity?: number;
}

const inMemoryCache = new Map<string, CachedResponse>();

export class SemanticCache {
  /**
   * Search for a similar query in the cache.
   */
  static async search(query: string, embedding?: number[], threshold = 0.85): Promise<CachedResponse | null> {
    // Exact match fallback
    if (inMemoryCache.has(query)) {
      return inMemoryCache.get(query) || null;
    }
    
    // For vector search, we do cosine similarity over inMemoryCache values if embedding is provided. 
    if (embedding && embedding.length > 0) {
       for (const entry of inMemoryCache.values()) {
         if (entry.embedding) {
            const similarity = this.cosineSimilarity(embedding, entry.embedding);
            if (similarity >= threshold) {
                return entry;
            }
         }
       }
    }
    
    return null;
  }

  /**
   * Store a response in the cache
   */
  static async store(query: string, response: string, embedding?: number[]): Promise<void> {
    inMemoryCache.set(query, { query, response, embedding });
  }

  private static cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
