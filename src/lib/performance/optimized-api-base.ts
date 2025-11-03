/**
 * 🚀 Optimized API Base
 * Base utilities for all optimized APIs with caching, auth, and real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { authCache } from './auth-cache';
import { realTimeStore } from './realtime-store';
import { backgroundSync } from './background-sync';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export interface OptimizedApiOptions {
  entity: string;
  requireAuth?: boolean;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  enableOptimisticUpdates?: boolean;
  enableBackgroundSync?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  cached?: boolean;
  queued?: boolean;
  message?: string;
}

export class OptimizedApiBase {
  private options: Required<OptimizedApiOptions>;

  constructor(options: OptimizedApiOptions) {
    this.options = {
      requireAuth: true,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      enableOptimisticUpdates: true,
      enableBackgroundSync: true,
      ...options
    };
  }

  /**
   * Fast authentication check using cache
   */
  async authenticateRequest(request: NextRequest): Promise<{
    success: boolean;
    userId?: string;
    email?: string;
    error?: string;
  }> {
    if (!this.options.requireAuth) {
      return { success: true };
    }

    try {
      // Import auth helpers dynamically
      const { authenticateRequest: authHelper } = await import('@/lib/utils/auth-helpers');

      // Use existing auth helper for consistency
      const auth = await authHelper(request);

      if (auth.success && auth.userId) {
        return {
          success: true,
          userId: auth.userId,
          email: auth.email
        };
      }

      return {
        success: false,
        error: auth.error || 'Authentication failed'
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Get cached data if available
   */
  getCachedData<T>(key?: string): T | null {
    if (!this.options.cacheEnabled) return null;

    const cacheKey = key || this.options.entity;
    return realTimeStore.getData(cacheKey);
  }

  /**
   * Set data in cache
   */
  setCachedData<T>(data: T, key?: string): void {
    if (!this.options.cacheEnabled) return;

    const cacheKey = key || this.options.entity;
    realTimeStore.setData(cacheKey, data);
  }

  /**
   * Create optimistic update
   */
  async createOptimisticUpdate<T>(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any,
    apiCall: () => Promise<T>,
    originalData?: any,
    key?: string
  ): Promise<T> {
    if (!this.options.enableOptimisticUpdates) {
      return await apiCall();
    }

    const cacheKey = key || this.options.entity;

    return realTimeStore.createOptimisticUpdate(
      cacheKey,
      type,
      data,
      apiCall,
      originalData
    );
  }

  /**
   * Queue operation for background sync
   */
  queueForBackgroundSync(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any,
    endpoint: string,
    method: string = 'POST',
    priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
  ): string {
    if (!this.options.enableBackgroundSync) {
      throw new Error('Background sync is disabled');
    }

    return backgroundSync.queueOperation(
      type,
      this.options.entity,
      data,
      endpoint,
      method,
      priority
    );
  }

  /**
   * Validate request data with Zod schema
   */
  validateData<T>(data: any, schema: z.ZodSchema<T>): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        success: false,
        errors: ['Validation failed']
      };
    }
  }

  /**
   * Create success response
   */
  successResponse<T>(data: T, message?: string, cached: boolean = false): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      cached,
      message
    };

    return NextResponse.json(response);
  }

  /**
   * Create error response
   */
  errorResponse(
    error: string,
    status: number = 400,
    details?: string[]
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      details
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Handle database operation with error handling
   */
  async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Database operation failed'
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : errorMessage
      };
    }
  }

  /**
   * Get optimized GET handler
   */
  createGetHandler<T>(
    fetchData: (userId: string) => Promise<T>,
    cacheKey?: string
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      console.log(`🚀 [Optimized ${this.options.entity} API] GET started`);

      try {
        // Fast auth check
        const auth = await this.authenticateRequest(request);
        if (!auth.success) {
          return this.errorResponse(auth.error || 'Authentication failed', 401);
        }

        // Check cache first
        const cached = this.getCachedData<T>(cacheKey);
        if (cached) {
          console.log(`✅ [Optimized ${this.options.entity} API] Returning cached data`);
          return this.successResponse(cached, undefined, true);
        }

        // Fetch from database
        const result = await this.handleDatabaseOperation(
          () => fetchData(auth.userId!),
          `Failed to fetch ${this.options.entity}`
        );

        if (!result.success) {
          return this.errorResponse(result.error!, 500);
        }

        // Cache the results
        this.setCachedData(result.data!, cacheKey);

        console.log(`✅ [Optimized ${this.options.entity} API] Data fetched and cached`);
        return this.successResponse(result.data!);

      } catch (error) {
        console.error(`❌ [Optimized ${this.options.entity} API] Error:`, error);
        return this.errorResponse('Internal server error', 500);
      }
    };
  }

  /**
   * Get optimized POST handler
   */
  createPostHandler<TInput, TOutput>(
    schema: z.ZodSchema<TInput>,
    createData: (userId: string, data: TInput) => Promise<TOutput>,
    endpoint: string,
    cacheKey?: string
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      console.log(`🚀 [Optimized ${this.options.entity} API] POST started`);

      try {
        // Fast auth check
        const auth = await this.authenticateRequest(request);
        if (!auth.success) {
          return this.errorResponse(auth.error || 'Authentication failed', 401);
        }

        // Parse and validate data
        const body = await request.json();
        const validation = this.validateData(body, schema);

        if (!validation.success) {
          return this.errorResponse('Invalid data', 400, validation.errors);
        }

        // Create optimistic update if enabled
        if (this.options.enableOptimisticUpdates) {
          try {
            const result = await this.createOptimisticUpdate(
              'CREATE',
              validation.data,
              () => createData(auth.userId!, validation.data!),
              undefined,
              cacheKey
            );

            console.log(`✅ [Optimized ${this.options.entity} API] Created with optimistic update`);
            return this.successResponse(result, 'Created successfully');

          } catch (error) {
            // If offline, queue for background sync
            if (this.options.enableBackgroundSync && !navigator?.onLine) {
              const operationId = this.queueForBackgroundSync(
                'CREATE',
                validation.data,
                endpoint,
                'POST',
                'HIGH'
              );

              console.log(`📤 [Optimized ${this.options.entity} API] Queued for background sync`);
              return NextResponse.json({
                success: true,
                data: { id: `temp_${Date.now()}`, ...validation.data },
                message: 'Queued for sync (offline)',
                queued: true
              });
            }

            throw error;
          }
        } else {
          // Traditional approach
          const result = await this.handleDatabaseOperation(
            () => createData(auth.userId!, validation.data!),
            `Failed to create ${this.options.entity}`
          );

          if (!result.success) {
            return this.errorResponse(result.error!, 500);
          }

          // Update cache
          const currentData = this.getCachedData<TOutput[]>(cacheKey) || [];
          if (Array.isArray(currentData)) {
            this.setCachedData([result.data!, ...currentData], cacheKey);
          } else {
            this.setCachedData(result.data!, cacheKey);
          }

          console.log(`✅ [Optimized ${this.options.entity} API] Created successfully`);
          return this.successResponse(result.data!, 'Created successfully');
        }

      } catch (error) {
        console.error(`❌ [Optimized ${this.options.entity} API] Error:`, error);
        return this.errorResponse('Internal server error', 500);
      }
    };
  }

  /**
   * Get optimized PUT handler
   */
  createPutHandler<TInput, TOutput>(
    schema: z.ZodSchema<TInput>,
    updateData: (userId: string, id: string, data: TInput) => Promise<TOutput>,
    endpoint: string,
    cacheKey?: string
  ) {
    return async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      console.log(`🚀 [Optimized ${this.options.entity} API] PUT started`);

      try {
        // Fast auth check
        const auth = await this.authenticateRequest(request);
        if (!auth.success) {
          return this.errorResponse(auth.error || 'Authentication failed', 401);
        }

        // Parse and validate data
        const body = await request.json();
        const validation = this.validateData(body, schema);

        if (!validation.success) {
          return this.errorResponse('Invalid data', 400, validation.errors);
        }

        // Get original data for rollback
        const currentData = this.getCachedData<TOutput[]>(cacheKey) || [];
        const originalItem = Array.isArray(currentData)
          ? currentData.find((item: any) => item.id === params.id)
          : currentData;

        // Create optimistic update if enabled
        if (this.options.enableOptimisticUpdates) {
          try {
            const result = await this.createOptimisticUpdate(
              'UPDATE',
              { id: params.id, ...validation.data },
              () => updateData(auth.userId!, params.id, validation.data!),
              originalItem,
              cacheKey
            );

            console.log(`✅ [Optimized ${this.options.entity} API] Updated with optimistic update`);
            return this.successResponse(result, 'Updated successfully');

          } catch (error) {
            // If offline, queue for background sync
            if (this.options.enableBackgroundSync && !navigator?.onLine) {
              const operationId = this.queueForBackgroundSync(
                'UPDATE',
                { id: params.id, ...validation.data },
                `${endpoint}/${params.id}`,
                'PUT',
                'HIGH'
              );

              console.log(`📤 [Optimized ${this.options.entity} API] Queued for background sync`);
              return NextResponse.json({
                success: true,
                data: { id: params.id, ...validation.data },
                message: 'Queued for sync (offline)',
                queued: true
              });
            }

            throw error;
          }
        } else {
          // Traditional approach
          const result = await this.handleDatabaseOperation(
            () => updateData(auth.userId!, params.id, validation.data!),
            `Failed to update ${this.options.entity}`
          );

          if (!result.success) {
            return this.errorResponse(result.error!, 500);
          }

          // Update cache
          if (Array.isArray(currentData)) {
            const updated = currentData.map((item: any) =>
              item.id === params.id ? result.data : item
            );
            this.setCachedData(updated, cacheKey);
          } else {
            this.setCachedData(result.data!, cacheKey);
          }

          console.log(`✅ [Optimized ${this.options.entity} API] Updated successfully`);
          return this.successResponse(result.data!, 'Updated successfully');
        }

      } catch (error) {
        console.error(`❌ [Optimized ${this.options.entity} API] Error:`, error);
        return this.errorResponse('Internal server error', 500);
      }
    };
  }

  /**
   * Get optimized DELETE handler
   */
  createDeleteHandler<TOutput>(
    deleteData: (userId: string, id: string) => Promise<void>,
    endpoint: string,
    cacheKey?: string
  ) {
    return async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      console.log(`🚀 [Optimized ${this.options.entity} API] DELETE started`);

      try {
        // Fast auth check
        const auth = await this.authenticateRequest(request);
        if (!auth.success) {
          return this.errorResponse(auth.error || 'Authentication failed', 401);
        }

        // Get original data for rollback
        const currentData = this.getCachedData<TOutput[]>(cacheKey) || [];
        const originalItem = Array.isArray(currentData)
          ? currentData.find((item: any) => item.id === params.id)
          : currentData;

        // Create optimistic update if enabled
        if (this.options.enableOptimisticUpdates) {
          try {
            await this.createOptimisticUpdate(
              'DELETE',
              { id: params.id },
              () => deleteData(auth.userId!, params.id),
              originalItem,
              cacheKey
            );

            console.log(`✅ [Optimized ${this.options.entity} API] Deleted with optimistic update`);
            return this.successResponse(null, 'Deleted successfully');

          } catch (error) {
            // If offline, queue for background sync
            if (this.options.enableBackgroundSync && !navigator?.onLine) {
              const operationId = this.queueForBackgroundSync(
                'DELETE',
                { id: params.id },
                `${endpoint}/${params.id}`,
                'DELETE',
                'HIGH'
              );

              console.log(`📤 [Optimized ${this.options.entity} API] Queued for background sync`);
              return NextResponse.json({
                success: true,
                message: 'Queued for sync (offline)',
                queued: true
              });
            }

            throw error;
          }
        } else {
          // Traditional approach
          const result = await this.handleDatabaseOperation(
            () => deleteData(auth.userId!, params.id),
            `Failed to delete ${this.options.entity}`
          );

          if (!result.success) {
            return this.errorResponse(result.error!, 500);
          }

          // Update cache
          if (Array.isArray(currentData)) {
            const filtered = currentData.filter((item: any) => item.id !== params.id);
            this.setCachedData(filtered, cacheKey);
          } else {
            this.setCachedData(null, cacheKey);
          }

          console.log(`✅ [Optimized ${this.options.entity} API] Deleted successfully`);
          return this.successResponse(null, 'Deleted successfully');
        }

      } catch (error) {
        console.error(`❌ [Optimized ${this.options.entity} API] Error:`, error);
        return this.errorResponse('Internal server error', 500);
      }
    };
  }
}
