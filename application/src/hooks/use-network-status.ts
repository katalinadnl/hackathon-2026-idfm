import { useEffect, useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface NetworkStatus {
  status: 'normal' | 'disrupted' | 'major_disruption';
  message: string;
  messageEn: string;
  updatedAt: string;
}

export function useNetworkStatus() {
  const [data, setData] = useState<NetworkStatus | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/transport/status`)
      .then((r) => r.ok ? r.json() as Promise<NetworkStatus> : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  return data;
}