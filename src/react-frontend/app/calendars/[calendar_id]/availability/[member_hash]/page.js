"use client";
import Head from "next/head";
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";

export default function UserAvailability() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(null);
  const [memberHash, setMemberHash] = useState(null);
  useEffect(() => {
    if (router.isReady) {

      const { calendar_id, member_hash } = router.query;
      setCalendarId(calendar_id);
      setMemberHash(member_hash);

    }
  }, [router.isReady, router.query]);
  return (
    <>
      <Head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Import Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700;900&family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div>Hi</div>
    </>
  );
}
