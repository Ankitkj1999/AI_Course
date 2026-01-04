import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap, DollarSign, Clock, CheckCircle, XCircle, BarChart3, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Provider {
  id: string;
  name: string;
  isAvailable: boolean;
  isFree: boolean;
  models: string[];
  error?: string | null;
}

interface ComparisonResult {
  provider: string;
  providerName: string;
  model: string;
  content: string;
  responseTime: number;
  error?: string;
  timestamp: string;
  metadata?: {
    promptLength: number;
    responseLength: number;
    temperature: number;
  };
}

interface ProviderComparisonProps {
  className?: string;
}

const ProviderComparison: React.FC<ProviderComparisonProps> = ({ className = '' }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Fetch providers on component mount
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await fetch('/api/llm/providers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const availableProviders = data.providers.filter((p: Provider) => p.isAvailable);
        setProviders(availableProviders);
        
        // Auto-select first 2 available providers for comparison
        if (availableProviders.length >= 2) {
          setSelectedProviders([availableProviders[0].id, availableProviders[1].id]);
        } else if (availableProviders.length === 1) {
          setSelectedProviders([availableProviders[0].id]);
        }
      } else {
        console.error('Failed to fetch providers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };

  const runComparison = async () => {
    if (!prompt.trim() || selectedProviders.length === 0) {
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Run all providers in parallel
      const promises = selectedProviders.map(async (providerId) => {
        const provider = providers.find(p => p.id === providerId);
        if (!provider) return null;

        try {
          const response = await fetch('/api/llm/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              prompt: prompt.trim(),
              provider: providerId,
              temperature: 0.7
            })
          });

          const data = await response.json();

          if (data.success) {
            return {
              provider: providerId,
              providerName: data.data.providerName,
              model: data.data.model,
              content: data.data.content,
              responseTime: data.data.responseTime,
              timestamp: data.timestamp,
              metadata: data.data.metadata
            };
          } else {
            return {
              provider: providerId,
              providerName: provider.name,
              model: 'N/A',
              content: '',
              responseTime: 0,
              error: data.error?.message || 'Generation failed',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          return {
            provider: providerId,
            providerName: provider.name,
            model: 'N/A',
            content: '',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Network error',
            timestamp: new Date().toISOString()
          };
        }
      });

      const comparisonResults = await Promise.all(promises);
      const validResults = comparisonResults.filter(result => result !== null) as ComparisonResult[];
      
      // Sort by response time (fastest first)
      validResults.sort((a, b) => a.responseTime - b.responseTime);
      
      setResults(validResults);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: Provider) => {
    return provider.isFree ? (
      <Zap className="w-4 h-4 text-green-500" />
    ) : (
      <DollarSign className="w-4 h-4 text-blue-500" />
    );
  };

  const getProviderBadge = (provider: Provider) => {
    return provider.isFree ? (
      <Badge variant="secondary" className="text-xs">
        <Zap className="w-3 h-3 mr-1" />
        FREE
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        <DollarSign className="w-3 h-3 mr-1" />
        PAID
      </Badge>
    );
  };

  const getPerformanceColor = (responseTime: number, allTimes: number[]) => {
    if (allTimes.length === 0) return 'text-gray-500';
    
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    
    if (responseTime === minTime) return 'text-green-600';
    if (responseTime === maxTime) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSpeedScore = (responseTime: number, allTimes: number[]) => {
    if (allTimes.length === 0) return 0;
    
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    
    if (minTime === maxTime) return 100;
    
    // Invert the score so faster = higher score
    return Math.round(((maxTime - responseTime) / (maxTime - minTime)) * 100);
  };

  if (loadingProviders) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
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
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Provider Comparison</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare responses from different AI providers to find the best fit for your needs.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Select Providers to Compare</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedProviders.includes(provider.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleProvider(provider.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getProviderIcon(provider)}
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getProviderBadge(provider)}
                    {selectedProviders.includes(provider.id) && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Models: {provider.models.slice(0, 2).join(', ')}
                  {provider.models.length > 2 && ` +${provider.models.length - 2} more`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Prompt</label>
          <Textarea
            placeholder="Enter a prompt to test with selected providers..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        {/* Run Comparison Button */}
        <Button
          onClick={runComparison}
          disabled={loading || selectedProviders.length === 0 || !prompt.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Comparison...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Compare Providers ({selectedProviders.length})
            </>
          )}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Comparison Results</h3>
            
            <Tabs defaultValue="responses" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="responses">Responses</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="responses" className="space-y-4">
                {results.map((result, index) => (
                  <Card key={result.provider} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{result.providerName}</span>
                          {providers.find(p => p.id === result.provider)?.isFree ? (
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
                          {index === 0 && !result.error && (
                            <Badge variant="default" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              FASTEST
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{result.responseTime}ms</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Model: {result.model}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {result.error ? (
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">{result.error}</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm">
                            {result.content}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4">
                  {results.map((result) => {
                    const allTimes = results.filter(r => !r.error).map(r => r.responseTime);
                    const speedScore = getSpeedScore(result.responseTime, allTimes);
                    
                    return (
                      <Card key={result.provider}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{result.providerName}</span>
                              {providers.find(p => p.id === result.provider)?.isFree ? (
                                <Badge variant="secondary" className="text-xs">FREE</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">PAID</Badge>
                              )}
                            </div>
                            <div className={`text-sm font-medium ${getPerformanceColor(result.responseTime, allTimes)}`}>
                              {result.responseTime}ms
                            </div>
                          </div>
                          
                          {!result.error && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Speed Score</span>
                                <span>{speedScore}/100</span>
                              </div>
                              <Progress value={speedScore} className="h-2" />
                              
                              {result.metadata && (
                                <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Response Length:</span>
                                    <div className="font-medium">{result.metadata.responseLength} chars</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Efficiency:</span>
                                    <div className="font-medium">
                                      {Math.round(result.metadata.responseLength / result.responseTime * 1000)} chars/sec
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {result.error && (
                            <div className="flex items-center space-x-2 text-red-600 text-sm">
                              <XCircle className="w-4 h-4" />
                              <span>{result.error}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderComparison;