import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react";
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

const getWeatherIcon = (conditions: string) => {
  const lower = conditions.toLowerCase();
  if (lower.includes('rain')) return <CloudRain className="h-8 w-8" />;
  if (lower.includes('cloud')) return <Cloud className="h-8 w-8" />;
  return <Sun className="h-8 w-8" />;
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-weather');
      
      if (error) throw error;
      
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast.error('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weather</CardTitle>
        <p className="text-xs text-muted-foreground">{weather.location}</p>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};
