const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/thank-you/[slug]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the downloadUrl logic
content = content.replace(
  'downloadUrl = hideSupabaseUrl(attachedFile.product_file_url);',
  'downloadUrl = `/api/download/${order.id}`;'
);
content = content.replace(
  'downloadUrl = hideSupabaseUrl(project.product_file_url);',
  'downloadUrl = `/api/download/${order.id}`;'
);

// We need to fetch download_count in Thank You page to show remaining downloads
// Wait, the page.tsx fetches `order`. If download_count is not defined, it will be undefined.
// Let's add a UI note below DownloadButton.

const newDownloadButton = `          {downloadUrl ? (
            <div className="ty-download-section">
              <h2 className="ty-section-title">Your digital product is ready</h2>
              <DownloadButton downloadUrl={downloadUrl} fileName={fileName} />
              <p className="ty-text-muted" style={{marginTop: '12px', fontSize: '0.85rem'}}>
                You have {5 - (order.download_count || 0)} downloads remaining.
              </p>
            </div>
          ) : (`;

content = content.replace(
  /\{\s*downloadUrl\s*\?\s*\([\s\S]*?<DownloadButton[\s\S]*?\/>\s*<\/div>\s*\)\s*:\s*\(/m,
  newDownloadButton
);

fs.writeFileSync(file, content);
console.log("Updated Thank You page.");
