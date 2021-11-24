import { useEffect, useRef, useState } from 'react';
import { Application } from 'app/models/App';
import ApplicationsAPIClient from '../../../services/Apps/ApplicationsAPIClient';

export function useApplications() {
  const [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<Application[]>();

  const handleListRef = useRef(async (searchQuery?: string) => {
    const res = await ApplicationsAPIClient.search(searchQuery);

    res && setApplications(res);
    setLoading(false);
  });

  const search = (searchQuery?: string) => handleListRef.current(searchQuery);

  useEffect(() => {
    handleListRef.current();
  }, []);

  return {
    applications,
    loading,
    search,
  };
}
