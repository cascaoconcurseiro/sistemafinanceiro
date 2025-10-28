'use client';

/**
 * Performance Dashboard Component
 * Administrative interface for monitoring database performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';

interface PerformanceStats {
  totalQueries: number;
  successRate: number;
  avgResponseTime: number;
  slowQueries: number;
  criticalQueries: number;
  errorRate: number;
  topSlowOperations: Array<{
    operation: string;
    avgDuration: number;
    count: number;
  }>;
}

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  slowQueryCount: number;
  connectionPoolHealth: 'good' | 'warning' | 'critical';
  lastCheck: Date;
}

interface CacheStats {
  stats: {
    size: number;
    max: number;
    calculatedSize: number;
    hitRate: number;
  };
  metrics: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    cacheHit: boolean;
  }>;
}

export default function PerformanceDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const [dashboardRes, healthRes, cacheRes] = await Promise.all([
        fetch('/api/admin/performance?type=dashboard', { credentials: 'include' }),
        fetch('/api/admin/performance?type=health', { credentials: 'include' }),
        fetch('/api/admin/performance?type=cache', { credentials: 'include' }),
      ]);

      const [dashboard, healthData, cache] = await Promise.all([
        dashboardRes.json(),
        healthRes.json(),
        cacheRes.json(),
      ]);

      if (dashboard.success) setDashboardData(dashboard.data);
      if (healthData.success) setHealth(healthData.data);
      if (cache.success) setCacheStats(cache.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const clearCache = async (pattern?: string) => {
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'clear-cache',
          pattern 
        }),
      });
      
      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const exportMetrics = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/performance?type=export&format=${format}`, { credentials: 'include' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export metrics:', error);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading performance data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor database performance and system health</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportMetrics('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <Alert className={health.status === 'critical' ? 'border-red-200 bg-red-50' : 
                         health.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                         'border-green-200 bg-green-50'}>
          <Database className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Database Status: {getHealthBadge(health.status)}</span>
              <span>Uptime: {formatUptime(health.uptime)}</span>
              <span>Avg Response: {formatDuration(health.avgResponseTime)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Last check: {new Date(health.lastCheck).toLocaleTimeString()}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData?.realTime && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.realTime.totalQueries}</div>
                    <p className="text-xs text-muted-foreground">Last 5 minutes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.realTime.successRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.realTime.successRate >= 95 ? 'Excellent' : 
                       dashboardData.realTime.successRate >= 90 ? 'Good' : 'Needs attention'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(dashboardData.realTime.avgResponseTime)}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.realTime.avgResponseTime < 100 ? 'Fast' : 
                       dashboardData.realTime.avgResponseTime < 500 ? 'Moderate' : 'Slow'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.realTime.slowQueries}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.realTime.criticalQueries > 0 && 
                        `${dashboardData.realTime.criticalQueries} critical`}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Top Slow Operations */}
          {dashboardData?.realTime?.topSlowOperations && (
            <Card>
              <CardHeader>
                <CardTitle>Slowest Operations</CardTitle>
                <CardDescription>Operations with highest average response time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.realTime.topSlowOperations.slice(0, 5).map((op: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{op.operation}</span>
                        <span className="text-sm text-muted-foreground ml-2">({op.count} calls)</span>
                      </div>
                      <Badge variant={op.avgDuration > 1000 ? 'destructive' : op.avgDuration > 500 ? 'secondary' : 'default'}>
                        {formatDuration(op.avgDuration)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          {/* Recent Slow Queries */}
          {dashboardData?.slowQueries && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Slow Queries</CardTitle>
                <CardDescription>Queries that took longer than expected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dashboardData.slowQueries.map((query: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{query.operation}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(query.timestamp).toLocaleString()}
                        </div>
                        {query.error && (
                          <div className="text-sm text-red-600 mt-1">{query.error}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={query.duration > 5000 ? 'destructive' : 'secondary'}>
                          {formatDuration(query.duration)}
                        </Badge>
                        {!query.success && (
                          <div className="text-sm text-red-600 mt-1">Failed</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          {cacheStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cacheStats.stats.size}</div>
                    <p className="text-xs text-muted-foreground">of {cacheStats.stats.max} max</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(cacheStats.stats.hitRate * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {cacheStats.stats.hitRate > 0.8 ? 'Excellent' : 
                       cacheStats.stats.hitRate > 0.6 ? 'Good' : 'Poor'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(cacheStats.stats.calculatedSize / 1024)}KB</div>
                    <p className="text-xs text-muted-foreground">Calculated size</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Actions</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => clearCache()}
                      className="w-full"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Cache Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Cache Activity</CardTitle>
                  <CardDescription>Latest cache hits and misses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cacheStats.metrics.slice(0, 20).map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div className="flex-1 truncate">
                          <span className="font-medium">{metric.query}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={metric.cacheHit ? 'default' : 'secondary'}>
                            {metric.cacheHit ? 'HIT' : 'MISS'}
                          </Badge>
                          <span className="text-muted-foreground">{formatDuration(metric.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          {dashboardData?.operationBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Operation Performance Breakdown</CardTitle>
                <CardDescription>Performance statistics by operation type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.operationBreakdown.map((op: any, index: number) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{op.operation}</span>
                        <Badge variant={op.successRate < 95 ? 'destructive' : 'default'}>
                          {op.successRate.toFixed(1)}% success
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Count:</span>
                          <div className="font-medium">{op.count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg:</span>
                          <div className="font-medium">{formatDuration(op.avgDuration)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min:</span>
                          <div className="font-medium">{formatDuration(op.minDuration)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max:</span>
                          <div className="font-medium">{formatDuration(op.maxDuration)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}