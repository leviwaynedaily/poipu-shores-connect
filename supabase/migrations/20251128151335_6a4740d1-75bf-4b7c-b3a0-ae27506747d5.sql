-- Insert web_theme_config with current values
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('web_theme_config', '{
  "appBackground": {"type": "default", "url": null, "opacity": 100},
  "homeBackground": {"type": "default", "url": null, "opacity": 100},
  "authBackground": {"type": "default", "url": null, "opacity": 100},
  "colors": {
    "light": {
      "background": "0 0% 100%",
      "foreground": "265 4% 12.9%",
      "card": "0 0% 100%",
      "cardForeground": "265 4% 12.9%",
      "primary": "266 4% 20.8%",
      "primaryForeground": "248 0.3% 98.4%",
      "secondary": "248 0.7% 96.8%",
      "secondaryForeground": "266 4% 20.8%",
      "muted": "248 0.7% 96.8%",
      "mutedForeground": "257 4.6% 55.4%",
      "accent": "248 0.7% 96.8%",
      "accentForeground": "266 4% 20.8%",
      "destructive": "27 24.5% 57.7%",
      "destructiveForeground": "0 0% 100%",
      "border": "256 1.3% 92.9%",
      "input": "256 1.3% 92.9%",
      "ring": "257 4% 70.4%"
    },
    "dark": {
      "background": "0 0% 15%",
      "foreground": "248 0.3% 98.4%",
      "card": "266 4% 20.8%",
      "cardForeground": "248 0.3% 98.4%",
      "primary": "256 1.3% 92.9%",
      "primaryForeground": "266 4% 20.8%",
      "secondary": "260 4.1% 27.9%",
      "secondaryForeground": "248 0.3% 98.4%",
      "muted": "260 4.1% 27.9%",
      "mutedForeground": "257 4% 70.4%",
      "accent": "260 4.1% 27.9%",
      "accentForeground": "248 0.3% 98.4%",
      "destructive": "22 19.1% 70.4%",
      "destructiveForeground": "248 0.3% 98.4%",
      "border": "0 0% 100% / 10%",
      "input": "0 0% 100% / 15%",
      "ring": "264 2.7% 55.1%"
    }
  },
  "glassEffect": {
    "enabled": true,
    "defaultIntensity": 90
  }
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert mobile_theme_config with mobile defaults
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('mobile_theme_config', '{
  "appBackground": {"type": "default", "url": null, "opacity": 100},
  "homeBackground": {"type": "default", "url": null, "opacity": 100},
  "colors": {
    "light": {
      "background": "0 0% 100%",
      "foreground": "265 4% 12.9%",
      "card": "0 0% 100%",
      "cardForeground": "265 4% 12.9%",
      "primary": "266 4% 20.8%",
      "primaryForeground": "248 0.3% 98.4%",
      "secondary": "248 0.7% 96.8%",
      "secondaryForeground": "266 4% 20.8%",
      "muted": "248 0.7% 96.8%",
      "mutedForeground": "257 4.6% 55.4%",
      "accent": "248 0.7% 96.8%",
      "accentForeground": "266 4% 20.8%",
      "destructive": "27 24.5% 57.7%",
      "destructiveForeground": "0 0% 100%",
      "border": "256 1.3% 92.9%",
      "input": "256 1.3% 92.9%",
      "ring": "257 4% 70.4%"
    },
    "dark": {
      "background": "0 0% 15%",
      "foreground": "248 0.3% 98.4%",
      "card": "266 4% 20.8%",
      "cardForeground": "248 0.3% 98.4%",
      "primary": "256 1.3% 92.9%",
      "primaryForeground": "266 4% 20.8%",
      "secondary": "260 4.1% 27.9%",
      "secondaryForeground": "248 0.3% 98.4%",
      "muted": "260 4.1% 27.9%",
      "mutedForeground": "257 4% 70.4%",
      "accent": "260 4.1% 27.9%",
      "accentForeground": "248 0.3% 98.4%",
      "destructive": "22 19.1% 70.4%",
      "destructiveForeground": "248 0.3% 98.4%",
      "border": "0 0% 100% / 10%",
      "input": "0 0% 100% / 15%",
      "ring": "264 2.7% 55.1%"
    }
  },
  "glassEffect": {
    "enabled": false,
    "defaultIntensity": 50
  },
  "cardRadius": 12,
  "navBarStyle": "solid"
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;