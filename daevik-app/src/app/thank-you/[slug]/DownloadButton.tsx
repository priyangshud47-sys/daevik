'use client';

import { useState } from 'react';

export default function DownloadButton({ downloadUrl, fileName }: { downloadUrl: string; fileName: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setDownloading(true);
    
    // We add ?download=filename to force Supabase to send Content-Disposition: attachment
    const separator = downloadUrl.includes('?') ? '&' : '?';
    const finalUrl = `${downloadUrl}${separator}download=${encodeURIComponent(fileName)}`;
    
    // Direct navigation is the most reliable way across all browsers (including Safari/iOS).
    // Because the server responds with an "attachment" header, the browser will download it 
    // and WILL NOT navigate away from the current page.
    window.location.href = finalUrl;

    // Reset button state after a short delay since we can't perfectly detect when download starts
    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  return (
    <a 
      href={downloadUrl}
      onClick={handleDownload}
      className="ty-btn ty-btn-primary"
      style={{ cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.8 : 1 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      {downloading ? 'Starting Download...' : `Download ${fileName}`}
    </a>
  );
}
