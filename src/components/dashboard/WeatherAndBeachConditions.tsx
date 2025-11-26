import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, CloudRain, Sun, Wind, Droplets, Waves } from "lucide-react";
import { toast } from "sonner";

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    conditions: string;
    description: string;
    icon: string;
    wind_speed: number;
    wind_deg: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    conditions: string;
    icon: string;
  }>;
  location: string;
}

interface BeachData {
  waveHeight: number;
  surfQuality: 'flat' | 'poor' | 'fair' | 'good' | 'excellent';
  waterTemp: number;
  uvIndex: number;
  windSpeed: number;
  nextHighTide: string;
  nextLowTide: string;
}

const getWeatherIcon = (conditions: string) => {
  const lower = conditions.toLowerCase();
  if (lower.includes('rain')) return <CloudRain className="h-8 w-8" />;
  if (lower.includes('cloud')) return <Cloud className="h-8 w-8" />;
  return <Sun className="h-8 w-8" />;
};

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

interface WeatherAndBeachConditionsProps {
  compact?: boolean;
}

export const WeatherAndBeachConditions = ({ compact = false }: WeatherAndBeachConditionsProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [beachConditions, setBeachConditions] = useState<BeachData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: weatherData, error } = await supabase.functions.invoke('get-weather');
      
      if (error) throw error;
      
      setWeather(weatherData);

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

      setBeachConditions(mockBeachData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load weather and beach conditions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather & Beach Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather || !beachConditions) return null;

  // Compact mobile view
  if (compact) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-semibold px-1">Weather & Beach</h3>
        <div className="flex items-center justify-between px-3 py-2 bg-card border rounded-lg text-sm">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.current.conditions)}
            <span className="font-semibold">{weather.current.temp}°F</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>{weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Waves className="h-4 w-4" />
            <span>{beachConditions.waveHeight}ft</span>
          </div>
          <Badge className={getSurfQualityColor(beachConditions.surfQuality)} variant="secondary">
            {beachConditions.surfQuality}
          </Badge>
        </div>
      </div>
    );
  }

  // Full desktop view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weather & Beach Conditions</CardTitle>
        <p className="text-xs text-muted-foreground">{weather.location}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weather.current.conditions)}
              <div>
                <div className="text-3xl font-bold">{weather.current.temp}°F</div>
                <p className="text-sm text-muted-foreground capitalize">
                  {weather.current.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span>{weather.current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span>{weather.current.wind_speed} mph</span>
            </div>
            <div className="text-muted-foreground">
              Feels {weather.current.feels_like}°F
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            {weather.forecast.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-muted-foreground">{day.date}</p>
                <div className="flex justify-center py-1">
                  {getWeatherIcon(day.conditions)}
                </div>
                <p className="text-sm font-medium">
                  {day.high}°/{day.low}°
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Beach Conditions Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Wave Height</p>
                <p className="text-2xl font-bold">{beachConditions.waveHeight} ft</p>
              </div>
            </div>
            <Badge className={getSurfQualityColor(beachConditions.surfQuality)}>
              {beachConditions.surfQuality}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Water Temp</p>
                <p className="text-lg font-semibold">{beachConditions.waterTemp}°F</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">UV Index</p>
                <p className={`text-lg font-semibold ${getUVColor(beachConditions.uvIndex)}`}>
                  {beachConditions.uvIndex}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">High Tide:</span>{' '}
              <span className="font-medium">{beachConditions.nextHighTide}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Low Tide:</span>{' '}
              <span className="font-medium">{beachConditions.nextLowTide}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};