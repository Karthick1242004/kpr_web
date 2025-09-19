import React from 'react';

interface GoogleDrivePdfViewerProps {
  fileId: string;
  className?: string;
}

const GoogleDrivePdfViewer: React.FC<GoogleDrivePdfViewerProps> = ({ fileId, className = '' }) => {
  // Google Drive embed URL format
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  
  return (
    <div className={`relative ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full h-full border-0 rounded-lg"
        title="PDF Viewer"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
        Google Drive PDF
      </div>
    </div>
  );
};

export default GoogleDrivePdfViewer;
