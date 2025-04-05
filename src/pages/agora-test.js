import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import Agora to avoid SSR issues
const AgoraTest = dynamic(() => import('../components/AgoraTest'), {
  ssr: false,
  loading: () => <p>Loading test component...</p>
});

export default function AgoraTestPage() {
  return (
    <>
      <Head>
        <title>Agora Connection Test</title>
      </Head>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Agora Connectivity Test</h1>
        <AgoraTest />
      </div>
    </>
  );
}