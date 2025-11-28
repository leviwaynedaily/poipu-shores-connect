import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PageConfig {
  id: string;
  title: string;
  subtitle?: string;
  route: string;
  icon: string;
  iconUrl: string | null;
  headerLogoUrl: string | null;
  order: number;
  isVisible: boolean;
}

export function usePageConfig() {
  const location = useLocation();
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPageConfig = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'web_pages_config')
          .maybeSingle();

        if (data?.setting_value) {
          const config = data.setting_value as any;
          if (config?.pages) {
            // Find the page config that matches the current route
            const currentPage = config.pages.find(
              (p: PageConfig) => p.route === location.pathname
            );
            setPageConfig(currentPage || null);
          }
        }
      } catch (error) {
        console.error('Error fetching page config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageConfig();
  }, [location.pathname]);

  return { pageConfig, isLoading };
}
