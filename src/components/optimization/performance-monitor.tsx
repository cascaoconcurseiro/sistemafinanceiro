'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Zap, RefreshCw } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  threshold: number;
}

interface ComponentRenderInfo {
  name: string;
  renderCount: number;
  lastRender: number;
  avgRenderTime: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private renderCounts: Map<string, ComponentRenderInfo> = new Map();
  private apiCalls: Map<string, { count: number; totalTime: number; lastCall: number }> = new Map();
  private subscribers: Set<() => void> = new Set();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  trackRender(componentName: string, renderTime: number = 0) {
    const existing = this.renderCounts.get(componentName);
    const now = Date.now();
    
    if (existing) {
      existing.renderCount++;
      existing.lastRender = now;
      existing.avgRenderTime = (existing.avgRenderTime + renderTime) / 2;
    } else {
      this.renderCounts.set(componentName, {
        name: componentName,
        renderCount: 1,
        lastRender: now,
        avgRenderTime: renderTime
      });
    }
    
    this.notifySubscribers();
  }

  trackApiCall(endpoint: string, duration: number) {
    const existing = this.apiCalls.get(endpoint);
    const now = Date.now();
    
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.lastCall = now;
    } else {
      this.apiCalls.set(endpoint, {
        count: 1,
        totalTime: duration,
        lastCall: now
      });
    }
    
    this.updateMetrics();
    this.notifySubscribers();
  }

  private updateMetrics() {
    // Calculate API performance metrics
    let totalApiCalls = 0;
    let totalApiTime = 0;
    
    this.apiCalls.forEach(call => {
      totalApiCalls += call.count;
      totalApiTime += call.totalTime;
    });
    
    const avgApiTime = totalApiCalls > 0 ? totalApiTime / totalApiCalls : 0;
    
    this.metrics.set('apiCalls', {
      name: 'API Calls',
      value: totalApiCalls,
      unit: 'calls',
      status: totalApiCalls > 50 ? 'error' : totalApiCalls > 20 ? 'warning' : 'good',
      threshold: 20
    });
    
    this.metrics.set('avgApiTime', {
      name: 'Avg API Time',
      value: avgApiTime,
      unit: 'ms',
      status: avgApiTime > 1000 ? 'error' : avgApiTime > 500 ? 'warning' : 'good',
      threshold: 500
    });
    
    // Calculate render performance
    let totalRenders = 0;
    let excessiveRenders = 0;
    
    this.renderCounts.forEach(render => {
      totalRenders += render.renderCount;
      if (render.renderCount > 10) excessiveRenders++;
    });
    
    this.metrics.set('totalRenders', {
      name: 'Total Renders',
      value: totalRenders,
      unit: 'renders',
      status: excessiveRenders > 3 ? 'error' : excessiveRenders > 1 ? 'warning' : 'good',
      threshold: 100
    });
    
    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      this.metrics.set('memoryUsage', {
        name: 'Memory Usage',
        value: Math.round(usedMemory),
        unit: 'MB',
        status: usedMemory > 100 ? 'error' : usedMemory > 50 ? 'warning' : 'good',
        threshold: 50
      });
    }
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  getRenderCounts(): ComponentRenderInfo[] {
    return Array.from(this.renderCounts.values())
      .sort((a, b) => b.renderCount - a.renderCount);
  }

  getApiCalls() {
    return Array.from(this.apiCalls.entries()).map(([endpoint, data]) => ({
      endpoint,
      ...data,
      avgTime: data.totalTime / data.count
    })).sort((a, b) => b.count - a.count);
  }

  reset() {
    this.metrics.clear();
    this.renderCounts.clear();
    this.apiCalls.clear();
    this.notifySubscribers();
  }
}

// Hook to track component renders
export function useRenderTracker(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      PerformanceMonitor.getInstance().trackRender(componentName, renderTime);
    };
  });
}

// Hook to track API calls
export function useApiTracker() {
  return useCallback((endpoint: string, duration: number) => {
    PerformanceMonitor.getInstance().trackApiCall(endpoint, duration);
  }, []);
}

export function PerformanceMonitorComponent() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [renderCounts, setRenderCounts] = useState<ComponentRenderInfo[]>([]);
  const [apiCalls, setApiCalls] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    const updateData = () => {
      setMetrics(monitor.getMetrics());
      setRenderCounts(monitor.getRenderCounts());
      setApiCalls(monitor.getApiCalls());
    };
    
    updateData();
    const unsubscribe = monitor.subscribe(updateData);
    
    return unsubscribe;
  }, []);

  const handleReset = () => {
    PerformanceMonitor.getInstance().reset();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Metrics */}
          <div>
            <h4 className="font-medium mb-2">System Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map(metric => (
                <div key={metric.name} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-xs">{metric.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{metric.value}{metric.unit}</span>
                    {metric.status === 'good' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {metric.status === 'warning' && <Clock className="h-3 w-3 text-yellow-500" />}
                    {metric.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rendering Components */}
          {renderCounts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Component Renders</h4>
              <div className="space-y-1">
                {renderCounts.slice(0, 5).map(render => (
                  <div key={render.name} className="flex items-center justify-between p-1 rounded bg-muted/30">
                    <span className="text-xs truncate">{render.name}</span>
                    <Badge variant={render.renderCount > 10 ? 'destructive' : render.renderCount > 5 ? 'secondary' : 'default'} className="text-xs">
                      {render.renderCount}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Calls */}
          {apiCalls.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">API Calls</h4>
              <div className="space-y-1">
                {apiCalls.slice(0, 5).map(call => (
                  <div key={call.endpoint} className="flex items-center justify-between p-1 rounded bg-muted/30">
                    <span className="text-xs truncate">{call.endpoint}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant={call.count > 10 ? 'destructive' : 'default'} className="text-xs">
                        {call.count}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(call.avgTime)}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PerformanceMonitor;