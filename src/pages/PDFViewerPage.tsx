import React, { useState, useRef, useEffect } from "react";
import { pdfjs } from "react-pdf";
import type { PDFReaderState } from "../types/pdf-reader";
import TopBar from "../components/top-bar";
import PdfViewer from "../components/pdf-viewer";
import GoogleDrivePdfViewer from "../components/GoogleDrivePdfViewer";
import { ArrowLeft } from "lucide-react";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerPageProps {
  pdfUrl: string;
  onBack: () => void;
}

const PDFViewerPage: React.FC<PDFViewerPageProps> = ({ pdfUrl, onBack }) => {
  const [state, setState] = useState<PDFReaderState>({
    file: null,
    fileName: "",
    numPages: 0,
    currentPage: 1,
    duration: 5,
    isPlaying: false,
    isFullscreen: false,
    progress: 0,
    isLoading: true,
    error: null,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [googleDriveFileId, setGoogleDriveFileId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Load PDF from URL on component mount
  useEffect(() => {
    loadPDFFromUrl(pdfUrl);
    return () => {
      // Cleanup interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pdfUrl]);

  // Page transition effect
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [state.currentPage]);

  const loadPDFFromUrl = async (url: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let response;
      let fileName = url.split('/').pop() || `scanned-pdf-${Date.now()}.pdf`;
      
      // For Google Drive URLs, try multiple approaches to avoid CORS
      if (url.includes('drive.google.com')) {
        try {
          // First, try direct fetch (might work in some cases)
          response = await fetch(url);
          if (!response.ok) {
            throw new Error('Direct fetch failed');
          }
        } catch (directError) {
          console.log('Direct fetch failed, trying CORS proxy...');
          
          // Try using a CORS proxy service
          const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
          try {
            response = await fetch(proxyUrl);
            if (!response.ok) {
              throw new Error('CORS proxy failed');
            }
          } catch (proxyError) {
            console.log('CORS proxy failed, trying alternative...');
            
            // Try another CORS proxy
            const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            response = await fetch(altProxyUrl);
            if (!response.ok) {
              throw new Error('All proxy methods failed');
            }
          }
        }
        fileName = 'google-drive-pdf.pdf';
      } else {
        // For non-Google Drive URLs, try direct fetch
        response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
      }

      const blob = await response.blob();
      
      // Verify that we got a PDF
      if (blob.type && !blob.type.includes('pdf') && !url.includes('drive.google.com')) {
        throw new Error('Downloaded content is not a PDF file');
      }
      
      const file = new File([blob], fileName, { type: 'application/pdf' });

      setState(prev => ({
        ...prev,
        file,
        fileName,
        currentPage: 1,
        isPlaying: false,
        numPages: 0,
        error: null,
        isLoading: false,
      }));

      // Clear any existing intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

    } catch (error) {
      console.error('Error loading PDF from URL:', error);
      
      // If this is a Google Drive URL and we haven't tried iframe fallback yet
      if (url.includes('drive.google.com') && !useIframeFallback) {
        console.log('Trying iframe fallback for Google Drive URL...');
        
        // Extract file ID for iframe embedding
        const fileIdMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          setGoogleDriveFileId(fileIdMatch[1]);
          setUseIframeFallback(true);
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: null
          }));
          return;
        }
      }
      
      let errorMessage = 'Failed to load PDF';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('blocked')) {
          errorMessage = 'CORS Error: Unable to load PDF due to browser security restrictions.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network Error: Unable to download PDF. Please check your internet connection.';
        } else {
          errorMessage = `Failed to load PDF: ${error.message}`;
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  };

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setState((prev) => ({
      ...prev,
      numPages,
      isLoading: false,
      error: null,
    }));
    
    // Auto-start slideshow after loading
    setTimeout(() => {
      if (!state.isPlaying && numPages > 0) {
        togglePlayPause();
      }
    }, 2000);
  };

  // Handle PDF load error
  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    setState((prev) => ({
      ...prev,
      error: "Failed to load PDF. Please try another file.",
      isLoading: false,
    }));
  };

  // Handle page render error
  const onPageRenderError = (error: Error) => {
    console.error("Error rendering page:", error);
    setState((prev) => ({ ...prev, error: "Failed to render PDF page" }));
  };

  // Start/Stop slideshow
  const togglePlayPause = () => {
    if (!state.file || state.numPages === 0 || state.isLoading) return;

    if (state.isPlaying) {
      // Pause
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      // Play
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.currentPage >= prev.numPages) {
            // Stop at last page
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return { ...prev, isPlaying: false };
          }
          return { ...prev, currentPage: prev.currentPage + 1 };
        });
      }, state.duration * 1000);

      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  // Manual page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= state.numPages && !state.isLoading) {
      setState((prev) => ({ ...prev, currentPage: page }));

      // Restart timer if playing
      if (state.isPlaying && intervalRef.current) {
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
          setState((prev) => {
            if (prev.currentPage >= prev.numPages) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              return { ...prev, isPlaying: false };
            }
            return { ...prev, currentPage: prev.currentPage + 1 };
          });
        }, state.duration * 1000);
      }
    }
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setState((prev) => ({ ...prev, duration: newDuration }));

    if (state.isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.currentPage >= prev.numPages) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return { ...prev, isPlaying: false };
          }
          return { ...prev, currentPage: prev.currentPage + 1 };
        });
      }, newDuration * 1000);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      setState((prev) => ({ ...prev, isFullscreen: !prev.isFullscreen }));
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case "Space":
          event.preventDefault();
          togglePlayPause();
          break;
        case "Escape":
          if (document.fullscreenElement || state.isFullscreen) {
            toggleFullscreen();
          }
          break;
        case "KeyF":
          event.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToPage(state.currentPage - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          goToPage(state.currentPage + 1);
          break;
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [state.isPlaying, state.currentPage, state.numPages]);

  // Dummy file upload handler (not used in this page)
  const handleFileUpload = () => {
    // Not implemented for this page
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-gray-900 text-white transition-all duration-300 ${
        state.isFullscreen ? "fixed inset-0 z-50 p-2" : "p-4"
      }`}
    >
      {/* Back Button */}
      {!state.isFullscreen && (
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Scanner
          </button>
        </div>
      )}


      {/* Show TopBar only for regular PDF viewer, not iframe */}
      {!useIframeFallback && (
        <TopBar
          state={state}
          handleDurationChange={handleDurationChange}
          goToPage={goToPage}
          toggleFullscreen={toggleFullscreen}
          togglePlayPause={togglePlayPause}
        />
      )}

      {/* Conditional rendering based on fallback mode */}
      {useIframeFallback && googleDriveFileId ? (
        <GoogleDrivePdfViewer
          fileId={googleDriveFileId}
          className="h-[80vh] bg-white rounded-lg"
        />
      ) : (
        <PdfViewer
          state={state}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          onDocumentLoadSuccess={onDocumentLoadSuccess}
          onDocumentLoadError={onDocumentLoadError}
          onPageRenderError={onPageRenderError}
          isTransitioning={isTransitioning}
        />
      )}

      {/* PDF URL Display - moved to bottom */}
      {!state.isFullscreen && (
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-gray-300">
              <strong>PDF Source:</strong>
            </div>
            {pdfUrl.includes('drive.google.com') && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs text-white transition-colors"
              >
                Open in Browser
              </a>
            )}
          </div>
          <div className="text-gray-100 break-all text-sm">
            {pdfUrl}
          </div>
          {state.error && state.error.includes('CORS') && (
            <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded">
              <p className="text-yellow-200 text-xs">
                💡 <strong>Tip:</strong> If loading fails, try clicking "Open in Browser" above to view the PDF directly.
              </p>
            </div>
          )}
          {useIframeFallback && (
            <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded">
              <p className="text-blue-200 text-xs">
                📄 <strong>Using iframe viewer:</strong> PDF controls may be limited in this mode.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFViewerPage;
