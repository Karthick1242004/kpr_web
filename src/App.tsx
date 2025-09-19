import React, { useState } from "react";
import QRScannerPage from "./pages/QRScannerPage";
import PDFViewerPage from "./pages/PDFViewerPage";

type AppState = 'scanner' | 'viewer';

const PDFSlideshowReader: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppState>('scanner');
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const handlePDFScanned = (url: string) => {
    setPdfUrl(url);
    setCurrentPage('viewer');
  };

  const handleBackToScanner = () => {
    setCurrentPage('scanner');
    setPdfUrl("");
  };

  return (
    <>
      {currentPage === 'scanner' && (
        <QRScannerPage onPDFScanned={handlePDFScanned} />
      )}
      {currentPage === 'viewer' && pdfUrl && (
        <PDFViewerPage pdfUrl={pdfUrl} onBack={handleBackToScanner} />
      )}
    </>
  );
};

export default PDFSlideshowReader;
