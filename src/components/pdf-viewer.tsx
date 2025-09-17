import { Document, Page } from "react-pdf";
import FileUpload from "./file-upload";
import type { PdfViewerProps } from "../types/pdf-reader";

const PdfViewer = ({
    state,
    fileInputRef,
    handleFileUpload,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    onPageRenderError,
    isTransitioning
}:PdfViewerProps) => {
  return (
    <div className="flex justify-center">
      {state.file ? (
        <div
          className={`bg-white shadow-lg  overflow-hidden 
              transition-all duration-500 ease-in-out transform
              ${isTransitioning ? "opacity-10 scale-95" : "opacity-100 scale-100"}
              ${state.isFullscreen ? "shadow-2xl" : ""}`}
        >
          <Document
            file={state.file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96 w-full bg-gray-100">
                <div className="text-center text-gray-600">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96 w-full bg-red-50">
                <div className="text-center text-red-600">
                  <p>Failed to load PDF</p>
                </div>
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={state.currentPage}
              scale={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderError={onPageRenderError}
              height={
                state.isFullscreen
                  ? window.innerHeight * 0.85
                  : window.innerHeight * 0.85
              }
            />
          </Document>
        </div>
      ) : (
        <FileUpload
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
};

export default PdfViewer;
