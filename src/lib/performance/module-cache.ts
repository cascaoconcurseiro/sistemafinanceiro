/**
 * 🚀 Smart Module Cache System
 * Intelligent caching for compiled modules to speed up development builds
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

interface CacheEntry {
  hash: string;
  timestamp: number;
  compiled: any;
  dependencies: string[];
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
}

class SmartModuleCache {
  private cacheDir: string;
  private maxCacheSize: number;
  private maxAge: number;
  private stats: CacheStats;

  constructor() {
    this.cacheDir = join(process.cwd(), '.next', 'cache', 'modules');
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
    this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.stats = { hits: 0, misses: 0, evictions: 0, totalSize: 0 };
    
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate hash for module content and dependencies
   */
  private generateHash(content: string, dependencies: string[]): string {
    const hash = createHash('sha256');
    hash.update(content);
    hash.update(JSON.stringify(dependencies.sort()));
    return hash.digest('hex');
  }

  /**
   * Get cache file path for module
   */
  private getCacheFilePath(modulePath: string): string {
    const moduleHash = createHash('md5').update(modulePath).digest('hex');
    return join(this.cacheDir, `${moduleHash}.json`);
  }

  /**
   * Check if module needs recompilation
   */
  needsRecompilation(modulePath: string, content: string, dependencies: string[]): boolean {
    const cacheFile = this.getCacheFilePath(modulePath);
    
    if (!existsSync(cacheFile)) {
      this.stats.misses++;
      return true;
    }

    try {
      const cached: CacheEntry = JSON.parse(readFileSync(cacheFile, 'utf-8'));
      const currentHash = this.generateHash(content, dependencies);
      
      // Check if hash matches
      if (cached.hash !== currentHash) {
        this.stats.misses++;
        return true;
      }

      // Check if cache is expired
      if (Date.now() - cached.timestamp > this.maxAge) {
        this.stats.misses++;
        return true;
      }

      // Check if dependencies changed
      for (const dep of dependencies) {
        if (existsSync(dep)) {
          const depStat = statSync(dep);
          if (depStat.mtime.getTime() > cached.timestamp) {
            this.stats.misses++;
            return true;
          }
        }
      }

      this.stats.hits++;
      return false;
    } catch (error) {
      console.warn(`Cache read error for ${modulePath}:`, error);
      this.stats.misses++;
      return true;
    }
  }

  /**
   * Cache compiled module
   */
  cacheCompiledModule(modulePath: string, content: string, compiled: any, dependencies: string[]): void {
    const cacheFile = this.getCacheFilePath(modulePath);
    const hash = this.generateHash(content, dependencies);
    
    const entry: CacheEntry = {
      hash,
      timestamp: Date.now(),
      compiled,
      dependencies,
      size: JSON.stringify(compiled).length
    };

    try {
      writeFileSync(cacheFile, JSON.stringify(entry, null, 2));
      this.stats.totalSize += entry.size;
      
      // Clean up if cache is too large
      this.cleanupIfNeeded();
    } catch (error) {
      console.warn(`Cache write error for ${modulePath}:`, error);
    }
  }

  /**
   * Get cached compiled module
   */
  getCachedModule(modulePath: string): any | null {
    const cacheFile = this.getCacheFilePath(modulePath);
    
    if (!existsSync(cacheFile)) {
      return null;
    }

    try {
      const cached: CacheEntry = JSON.parse(readFileSync(cacheFile, 'utf-8'));
      return cached.compiled;
    } catch (error) {
      console.warn(`Cache read error for ${modulePath}:`, error);
      return null;
    }
  }

  /**
   * Clean up cache if it exceeds size limit
   */
  private cleanupIfNeeded(): void {
    if (this.stats.totalSize > this.maxCacheSize) {
      this.performCleanup();
    }
  }

  /**
   * Perform cache cleanup - remove oldest entries
   */
  private performCleanup(): void {
    try {
      const cacheFiles = require('fs').readdirSync(this.cacheDir);
      const entries: Array<{ file: string; timestamp: number; size: number }> = [];

      for (const file of cacheFiles) {
        const filePath = join(this.cacheDir, file);
        try {
          const cached: CacheEntry = JSON.parse(readFileSync(filePath, 'utf-8'));
          entries.push({
            file: filePath,
            timestamp: cached.timestamp,
            size: cached.size
          });
        } catch (error) {
          // Remove corrupted cache files
          require('fs').unlinkSync(filePath);
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries until we're under the limit
      let currentSize = this.stats.totalSize;
      const targetSize = this.maxCacheSize * 0.8; // Clean to 80% of limit

      for (const entry of entries) {
        if (currentSize <= targetSize) break;
        
        try {
          require('fs').unlinkSync(entry.file);
          currentSize -= entry.size;
          this.stats.evictions++;
        } catch (error) {
          console.warn(`Failed to remove cache file ${entry.file}:`, error);
        }
      }

      this.stats.totalSize = currentSize;
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    try {
      const cacheFiles = require('fs').readdirSync(this.cacheDir);
      for (const file of cacheFiles) {
        require('fs').unlinkSync(join(this.cacheDir, file));
      }
      this.stats = { hits: 0, misses: 0, evictions: 0, totalSize: 0 };
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('📊 Module Cache Statistics:');
    console.log(`   Hits: ${stats.hits}`);
    console.log(`   Misses: ${stats.misses}`);
    console.log(`   Hit Rate: ${stats.hitRate}%`);
    console.log(`   Evictions: ${stats.evictions}`);
    console.log(`   Total Size: ${Math.round(stats.totalSize / 1024)}KB`);
  }
}

// Singleton instance
export const moduleCache = new SmartModuleCache();

// Export for webpack plugin
export default SmartModuleCache;