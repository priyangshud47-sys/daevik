export default function DownloadButton({ downloadUrl, fileName }: { downloadUrl: string; fileName: string }) {
  // We use a pure native anchor tag pointing to the secure API route
  return (
    <a 
      href={downloadUrl}
      className="ty-btn ty-btn-primary"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Download {fileName}
    </a>
  );
}
