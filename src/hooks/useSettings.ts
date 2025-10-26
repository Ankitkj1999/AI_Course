import { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from '@/constants';

interface Settings {
  [key: string]: {
    value: string;
    category: string;
    isSecret: boolean;
  };
}

interface UseSettingsReturn {
  settings: Settings;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch public settings (non-secret ones that client needs)
      const response = await axios.get(`${serverURL}/api/public/settings`);
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  };
};