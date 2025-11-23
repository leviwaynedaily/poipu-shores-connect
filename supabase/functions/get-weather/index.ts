import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    // Poipu, Kauai coordinates
    const lat = 21.8797;
    const lon = -159.4564;

    // Fetch current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process forecast to get daily data
    const dailyForecast = forecastData.list
      .filter((_: any, index: number) => index % 8 === 0) // Get one per day (every 8th 3-hour forecast)
      .slice(0, 3)
      .map((item: any) => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        conditions: item.weather[0].main,
        icon: item.weather[0].icon,
      }));

    const weatherData = {
      current: {
        temp: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        conditions: currentData.weather[0].main,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        wind_speed: Math.round(currentData.wind.speed),
        wind_deg: currentData.wind.deg,
      },
      forecast: dailyForecast,
      location: 'Poipu Beach, Kauai',
      timestamp: new Date().toISOString(),
    };

    console.log('Weather data fetched successfully');

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
