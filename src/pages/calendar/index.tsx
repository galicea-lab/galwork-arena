import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CalendarRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/events');
  }, [router]);

  return null;
}
