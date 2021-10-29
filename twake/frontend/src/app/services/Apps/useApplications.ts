import { useEffect, useRef, useState } from 'react';
import { Application } from 'app/models/App';
import ApplicationsAPIClient from './ApplicationsAPIClient';

export function useApplications() {
  const [isLoadingApplicationsList, setIsLoadingApplicationsList] = useState<boolean>(true);
  const [applicationsList, setApplicationsList] = useState<Application[]>();

  const handleListRef = useRef(async (searchQuery?: string) => {
    const res = await ApplicationsAPIClient.search(searchQuery);

    res && setApplicationsList(res);
    setIsLoadingApplicationsList(false);
  });

  const searchApplicationsInTwake = (searchQuery?: string) => handleListRef.current(searchQuery);

  useEffect(() => {
    handleListRef.current();
  }, []);

  return {
    applicationsList,
    isLoadingApplicationsList,
    searchApplicationsInTwake,
  };
}
