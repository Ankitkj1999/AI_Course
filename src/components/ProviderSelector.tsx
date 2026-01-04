import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Zap, DollarSign, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getGlobalProviderPreferences } from '@/hooks/useProviderPreferences';
import ProviderPerformanceIndicator from './ProviderPerformanceIndicator';

interface Provider {
  id: string;
  name: string;
  isAvailable: boolean;
  isFree: boolean;
  models: string[];
  error?: string | null;
}

interface ProviderHealth {
  providerId: string;
  status: string;
  data: {
    healthy: boolean;
    responseTime?: number;
    error?: string;
    timestamp: string;
  };
}

interface ProviderSelectorProps {
  selectedProvider?: string;
  selectedModel?: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (model: string) => void;
  className?: string;
  showHealthStatus?: boolean;
  showModelSelector?: boolean;
  autoLoadPreferences?: boolean; // New prop to control auto-loading preferences
  showPerformanceIndicators?: boolean; // New prop to show performance info
  showCostInfo?: boolean; // New prop to show cost information
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  className = '',
  showHealthStatus = true,
  showModelSelector = true,
  autoLoadPreferences = true,
  showPerformanceIndicators = false,
  showCostInfo = false
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [healthData, setHealthData] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);

  // Fetch providers on component mount
  useEffect(() => {
    fetchProviders();
  }, []);

  // Auto-load preferences and select provider if none selected
  useEffect(() => {
    if (!selectedProvider && providers.length > 0 && autoLoadPreferences) {
      const preferences = getGlobalProviderPreferences();
      
      // First try to use saved preferences
      if (preferences.provider) {
        const savedProvider = providers.find(p => p.id === preferences.provider && p.isAvailable);
        if (savedProvider) {
          onProviderChange(savedProvider.id);
          return;
        }
      }
      
      // Fallback to first available provider
      const availableProvider = providers.find(p => p.isAvailable);
      if (availableProvider) {
        onProviderChange(availableProvider.id);
      }
    }
  }, [providers, selectedProvider, onProviderChange, autoLoadPreferences]);

  // Auto-select model when provider changes
  useEffect(() => {
    if (selectedProvider && !selectedModel && autoLoadPreferences) {
      const provider = providers.find(p => p.id === selectedProvider);
      if (provider && provider.models.length > 0) {
        const preferences = getGlobalProviderPreferences();
        
        // First try to use saved model if it's available for this provider
        if (preferences.model && provider.models.includes(preferences.model)) {
          onModelChange(preferences.model);
        } else {
          // Fallback to first available model
          onModelChange(provider.models[0]);
        }
      }
    }
  }, [selectedProvider, selectedModel, providers, onModelChange, autoLoadPreferences]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/llm/providers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched providers:', data.providers); // Debug log
        setProviders(data.providers);
      } else {
        console.error('Failed to fetch providers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      // Set empty providers array on error to prevent infinite loading
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    try {
      setHealthLoading(true);
      const response = await fetch('/api/llm/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data.health);
      } else {
        console.error('Failed to fetch health data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      // Clear health data on error
      setHealthData([]);
    } finally {
      setHealthLoading(false);
    }
  };

  const getProviderHealth = (providerId: string) => {
    return healthData.find(h => h.providerId === providerId);
  };

  const getHealthIcon = (providerId: string) => {
    const health = getProviderHealth(providerId);
    if (!health) return <Clock className="w-4 h-4 text-gray-400" />;
    
    return health.data.healthy ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getHealthTooltip = (providerId: string) => {
    const health = getProviderHealth(providerId);
    if (!health) return 'Health status unknown';
    
    if (health.data.healthy) {
      return `Healthy (${health.data.responseTime}ms)`;
    } else {
      return `Unhealthy: ${health.data.error}`;
    }
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading providers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">LLM Provider</h3>
          {showHealthStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealthData}
              disabled={healthLoading}
            >
              {healthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Check Health'
              )}
            </Button>
          )}
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Debug: {providers.length} providers loaded, Available: {providers.filter(p => p.isAvailable).length}
          </div>
        )}

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <Select value={selectedProvider} onValueChange={onProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem 
                  key={provider.id} 
                  value={provider.id}
                  disabled={!provider.isAvailable}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span>{provider.name}</span>
                    {provider.isFree && (
                      <Badge variant="secondary" className="text-xs pointer-events-none">
                        <Zap className="w-3 h-3 mr-1" />
                        FREE
                      </Badge>
                    )}
                    {!provider.isFree && (
                      <Badge variant="outline" className="text-xs pointer-events-none">
                        <DollarSign className="w-3 h-3 mr-1" />
                        PAID
                      </Badge>
                    )}
                    {showHealthStatus && (
                      <span className="ml-2 pointer-events-none">
                        {getHealthIcon(provider.id)}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedProviderData && !selectedProviderData.isAvailable && (
            <p className="text-sm text-red-600">
              ⚠️ {selectedProviderData.error || 'Provider not available'}
            </p>
          )}
        </div>

        {/* Model Selection */}
        {showModelSelector && selectedProviderData && selectedProviderData.isAvailable && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {selectedProviderData.models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Provider Info */}
        {selectedProviderData && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Status:</span>
              <div className="flex items-center space-x-2">
                {selectedProviderData.isAvailable ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Available</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Unavailable</span>
                  </>
                )}
              </div>
            </div>
            
            {showHealthStatus && getProviderHealth(selectedProvider) && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                <span>Response Time:</span>
                <span>
                  {getProviderHealth(selectedProvider)?.data.responseTime || 'N/A'}ms
                </span>
              </div>
            )}
          </div>
        )}

        {/* Performance Indicators */}
        {showPerformanceIndicators && selectedProvider && selectedProviderData?.isAvailable && (
          <div className="pt-2 border-t">
            <ProviderPerformanceIndicator
              providerId={selectedProvider}
              showCostInfo={showCostInfo}
              showSpeedInfo={true}
              showHealthStatus={false} // Already shown above
              compact={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderSelector;