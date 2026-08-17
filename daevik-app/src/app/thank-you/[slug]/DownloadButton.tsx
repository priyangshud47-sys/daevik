export default function DownloadButton({ downloadUrl, fileName }: { downloadUrl: string; fileName: string }) {
  // We use a pure native anchor tag with the HTML5 download attribute.
  // Because /cdn/... is a same-origin URL, all browsers (including Safari) 
  // will respect the download attribute and save the file directly without opening the PDF viewer.
  
  const separator = downloadUrl.includes('?') ? '&' : '?';
  const finalUrl = `${downloadUrl}${separator}download=${encodeURIComponent(fileName)}`;

  return (
    <a 
      href={finalUrl}
      download={fileName}
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
