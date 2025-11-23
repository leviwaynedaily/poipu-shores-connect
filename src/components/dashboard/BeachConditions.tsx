import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Waves, Sun, Wind, Droplets } from "lucide-react";
import { toast } from "sonner";

interface BeachData {
  waveHeight: number;
  surfQuality: 'flat' | 'poor' | 'fair' | 'good' | 'excellent';
  waterTemp: number;
  uvIndex: number;
  windSpeed: number;
  nextHighTide: string;
  nextLowTide: string;
}

const getSurfQualityColor = (quality: string) => {
  switch (quality) {
    case 'excellent': return 'bg-green-500';
    case 'good': return 'bg-green-400';
    case 'fair': return 'bg-yellow-400';
    case 'poor': return 'bg-orange-400';
    default: return 'bg-gray-400';
  }
};

const getUVColor = (uv: number) => {
  if (uv <= 2) return 'text-green-600';
  if (uv <= 5) return 'text-yellow-600';
  if (uv <= 7) return 'text-orange-600';
  return 'text-red-600';
};

export const BeachConditions = () => {
  const [conditions, setConditions] = useState<BeachData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBeachConditions = async () => {
    try {
      // Get weather data which includes some beach-relevant info
      const { data: weatherData, error } = await supabase.functions.invoke('get-weather');
      
      if (error) throw error;

      // Simulate beach conditions (in production, use a marine weather API)
      const mockBeachData: BeachData = {
        waveHeight: 2.5,
        surfQuality: 'good',
        waterTemp: 78,
        uvIndex: 8,
        windSpeed: weatherData?.current?.wind_speed || 12,
        nextHighTide: '2:45 PM',
        nextLowTide: '8:30 PM',
      };

      setConditions(mockBeachData);
    } catch (error) {
      console.error('Error fetching beach conditions:', error);
      toast.error('Failed to load beach conditions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeachConditions();
    const interval = setInterval(fetchBeachConditions, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beach Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!conditions) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Beach Conditions</CardTitle>
        <p className="text-xs text-muted-foreground">Poipu Beach</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Wave Height</p>
              <p className="text-2xl font-bold">{conditions.waveHeight} ft</p>
            </div>
          </div>
          <Badge className={getSurfQualityColor(conditions.surfQuality)}>
            {conditions.surfQuality}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Water Temp</p>
              <p className="text-lg font-semibold">{conditions.waterTemp}°F</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-lg font-semibold">{conditions.windSpeed} mph</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">UV Index</p>
              <p className={`text-lg font-semibold ${getUVColor(conditions.uvIndex)}`}>
                {conditions.uvIndex}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">High Tide:</span>{' '}
            <span className="font-medium">{conditions.nextHighTide}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Low Tide:</span>{' '}
            <span className="font-medium">{conditions.nextLowTide}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
