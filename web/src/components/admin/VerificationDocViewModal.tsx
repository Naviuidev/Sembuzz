import { useState } from 'react';
import { imageSrc } from '../../utils/image';

function getDocExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
}

function getDocFilename(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const seg = clean.split('/').pop();
  return seg && seg.includes('.') ? seg : 'document';
}

type Props = {
  viewDocUrl: string;
  onClose: () => void;
};

/** Same preview behavior as school admin user-requests / automated users. */
export function VerificationDocViewModal({ viewDocUrl, onClose }: Props) {
  const [docPreviewFailed, setDocPreviewFailed] = useState(false);
  const resolvedUrl = imageSrc(viewDocUrl);
  const ext = getDocExt(viewDocUrl);
  const isPdf = ext === 'pdf';
  const isBrowserImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  const needsFallback = docPreviewFailed || (!isPdf && !isBrowserImage);
  const downloadName = getDocFilename(viewDocUrl);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card shadow-lg border-0"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: 700,
          borderRadius: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="View document"
      >
        <div
          className="card-header d-flex justify-content-between align-items-center py-2 px-3"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <span style={{ fontWeight: 600, color: '#1a1f2e' }}>View document</span>
          <button type="button" className="btn btn-sm btn-link text-dark p-1" onClick={onClose} title="Close">
            <i className="bi bi-x-lg" aria-hidden />
          </button>
        </div>
        <div className="card-body p-0" style={{ minHeight: 400 }}>
          {needsFallback ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
              <p className="mb-3 text-muted">
                {docPreviewFailed
                  ? 'Could not load this document. It may be missing on the server or stored on another environment.'
                  : `Preview is not supported for this file type${ext ? ` (.${ext})` : ''}. Open or download the file instead.`}
              </p>
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Open document
                </a>
                <a href={resolvedUrl} download={downloadName} className="btn btn-outline-secondary btn-sm">
                  Download
                </a>
              </div>
            </div>
          ) : isPdf ? (
            <iframe src={resolvedUrl} title="Document" style={{ width: '100%', height: 450, border: 'none' }} />
          ) : (
            <img
              src={resolvedUrl}
              alt="Uploaded document"
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
              onError={() => setDocPreviewFailed(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
