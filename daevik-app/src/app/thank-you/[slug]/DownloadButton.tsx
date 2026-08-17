'use client';

import { useState } from 'react';

export default function DownloadButton({ downloadUrl, fileName }: { downloadUrl: string; fileName: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // If it's not a relative CDN URL, just try the standard download
    if (!downloadUrl.startsWith('/')) {
      window.open(`${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(fileName)}`, '_blank');
      return;
    }

    setDownloading(true);
    try {
      // Fetch the file as a blob to force the browser to download it instead of opening it
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed, falling back to new tab:', err);
      window.open(`${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}download=true`, '_blank');
    } finally {
      setDownloading(false);
    }
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
      {downloading ? 'Downloading...' : `Download ${fileName}`}
    </a>
  );
}
