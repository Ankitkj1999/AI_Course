import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  isAvailable: boolean;
  isFree: boolean;
  models: string[];
  error?: string | null;
}

interface ProviderHealth {
  provider: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
  timestamp: string;
}

interface ProviderPerformanceIndicatorProps {
  providerId?: string;
  showCostInfo?: boolean;
  showSpeedInfo?: boolean;
  showHealthStatus?: boolean;
  compact?: boolean;
  className?: string;
}

// Estimated cost information (approximate, for display purposes)
const PROVIDER_COST_INFO = {
  gemini: {
    inputCost: 0.00015, // per 1K tokens
    outputCost: 0.0006, // per 1K tokens
    currency: 'USD'
  },
  groq: {
    inputCost: 0, // Free tier
    outputCost: 0,
    currency: 'USD',
    note: 'Free with rate limits'
  },
  openai: {
    inputCost: 0.0005, // GPT-3.5-turbo
    outputCost: 0.0015,
    currency: 'USD'
  },
  anthropic: {
    inputCost: 0.0008, // Claude-3-haiku
    outputCost: 0.0024,
    currency: 'USD'
  },
  openrouter: {
    inputCost: 0, // Free models available
    outputCost: 0,
    currency: 'USD',
    note: 'Varies by model'
  }
};

// Typical performance characteristics (approximate)
const PROVIDER_PERFORMANCE_INFO = {
  gemini: {
    avgResponseTime: 2500,
    reliability: 95,
    throughput: 'High'
  },
  groq: {
    avgResponseTime: 800,
    reliability: 90,
    throughput: 'Very High'
  },
  openai: {
    avgResponseTime: 3000,
    reliability: 98,
    throughput: 'Medium'
  },
  anthropic: {
    avgResponseTime: 4000,
    reliability: 96,
    throughput: 'Medium'
  },
  openrouter: {
    avgResponseTime: 2000,
    reliability: 88,
    throughput: 'Variable'
  }
};

const ProviderPerformanceIndicator: React.FC<ProviderPerformanceIndicatorProps> = ({
  providerId,
  showCostInfo = true,
  showSpeedInfo = true,
  showHealthStatus = true,
  compact = false,
  className = ''
}) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (providerId) {
      fetchProviderInfo();
    }
  }, [providerId]);

  const fetchProviderInfo = async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      
      // Fetch provider info
      const providersResponse = await fetch('/api/llm/providers');
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        if (providersData.success) {
          const foundProvider = providersData.providers.find((p: Provider) => p.id === providerId);
          setProvider(foundProvider || null);
        }
      }

      // Fetch health info if requested
      if (showHealthStatus) {
        const healthResponse = await fetch(`/api/llm/health/${providerId}`);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          if (healthData.success) {
            setHealth(healthData.health);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!providerId || !provider) {
    return null;
  }

  const costInfo = PROVIDER_COST_INFO[providerId as keyof typeof PROVIDER_COST_INFO];
  const perfInfo = PROVIDER_PERFORMANCE_INFO[providerId as keyof typeof PROVIDER_PERFORMANCE_INFO];

  const getHealthIcon = () => {
    if (!health) return <Info className="w-4 h-4 text-gray-400" />;
    
    if (health.healthy) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getHealthColor = () => {
    if (!health) return 'text-gray-500';
    return health.healthy ? 'text-green-600' : 'text-red-600';
  };

  const getSpeedIcon = (responseTime?: number) => {
    if (!responseTime && !perfInfo) return <Minus className="w-4 h-4 text-gray-400" />;
    
    const time = responseTime || perfInfo?.avgResponseTime || 0;
    
    if (time < 1500) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (time < 3000) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getSpeedLabel = (responseTime?: number) => {
    if (!responseTime && !perfInfo) return 'Unknown';
    
    const time = responseTime || perfInfo?.avgResponseTime || 0;
    
    if (time < 1500) return 'Fast';
    if (time < 3000) return 'Medium';
    return 'Slow';
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    return `$${cost.toFixed(4)}/1K tokens`;
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Provider Type Badge */}
        {provider.isFree ? (
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            FREE
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            <DollarSign className="w-3 h-3 mr-1" />
            PAID
          </Badge>
        )}

        {/* Health Status */}
        {showHealthStatus && (
          <Tooltip>
            <TooltipTrigger>
              {getHealthIcon()}
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {health ? 
                  (health.healthy ? 
                    `Healthy (${health.responseTime}ms)` : 
                    `Unhealthy: ${health.error}`
                  ) : 
                  'Health status unknown'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Speed Indicator */}
        {showSpeedInfo && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center space-x-1">
                {getSpeedIcon(health?.responseTime)}
                <span className="text-xs text-muted-foreground">
                  {getSpeedLabel(health?.responseTime)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Response Time: {health?.responseTime || perfInfo?.avgResponseTime || 'Unknown'}ms
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{provider.name}</h4>
          {provider.isFree ? (
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              FREE
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              PAID
            </Badge>
          )}
        </div>

        {/* Health Status */}
        {showHealthStatus && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center space-x-2">
              {getHealthIcon()}
              <span className={getHealthColor()}>
                {health ? (health.healthy ? 'Healthy' : 'Unhealthy') : 'Unknown'}
              </span>
            </div>
          </div>
        )}

        {/* Speed Information */}
        {showSpeedInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Speed:</span>
              <div className="flex items-center space-x-2">
                {getSpeedIcon(health?.responseTime)}
                <span>{getSpeedLabel(health?.responseTime)}</span>
              </div>
            </div>
            
            {(health?.responseTime || perfInfo?.avgResponseTime) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Response Time:</span>
                <span>{health?.responseTime || perfInfo?.avgResponseTime}ms</span>
              </div>
            )}

            {perfInfo?.throughput && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Throughput:</span>
                <span>{perfInfo.throughput}</span>
              </div>
            )}
          </div>
        )}

        {/* Cost Information */}
        {showCostInfo && costInfo && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">
                {costInfo.inputCost === 0 ? 'Free' : formatCost(costInfo.inputCost)}
              </span>
            </div>
            
            {costInfo.inputCost > 0 && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Input:</span>
                  <span>{formatCost(costInfo.inputCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Output:</span>
                  <span>{formatCost(costInfo.outputCost)}</span>
                </div>
              </div>
            )}
            
            {costInfo.note && (
              <div className="text-xs text-muted-foreground italic">
                {costInfo.note}
              </div>
            )}
          </div>
        )}

        {/* Availability Status */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Available:</span>
          <div className="flex items-center space-x-2">
            {provider.isAvailable ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Yes</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">No</span>
              </>
            )}
          </div>
        </div>

        {provider.error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {provider.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderPerformanceIndicator;