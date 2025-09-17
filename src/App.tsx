import React, { useState, useRef, useEffect } from "react";
import { pdfjs } from "react-pdf";
import type { PDFReaderState } from "./types/pdf-reader";
import TopBar from "./components/top-bar";
import PdfViewer from "./components/pdf-viewer";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFSlideshowReader: React.FC = () => {
  const [state, setState] = useState<PDFReaderState>({
    file: null,
    fileName: "",
    numPages: 0,
    currentPage: 1,
    duration: 5,
    isPlaying: false,
    isFullscreen: false,
    progress: 0,
    isLoading: false,
    error: null,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [state.currentPage]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = event instanceof File ? event : event.target.files?.[0];

    if (!file) {
      setState((prev) => ({
        ...prev,
        error: "No file selected",
      }));
      return;
    }
    if (!file.type.includes("pdf")) {
      setState((prev) => ({
        ...prev,
        error: "Please select a valid PDF file",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      file,
      currentPage: 1,
      isPlaying: false,
      numPages: 0,
      error: null,
      isLoading: true,
    }));

    // Clear any existing intervals to avoid multiple timers running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Debug log (optional, remove in production)
    console.log("Uploaded file:", file.name, "Type:", file.type);
  };

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setState((prev) => ({
      ...prev,
      numPages,
      isLoading: false,
      error: null,
    }));
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
      // Fallback: toggle fullscreen class for styling
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


   useEffect(() => {
    fetch("/Nursery-Rhymes-Book.pdf")
      .then((res) => res.blob())
      .then((blob) => {
        const defaultFile = new File([blob], "Nursery-Rhymes-Book.pdf", {
          type: "application/pdf",
        });
        setState((prev) => ({
          ...prev,
          file: defaultFile,
          fileName: "Nursery-Rhymes-Book.pdf",
        }));
      })
      .catch(() =>
        setState((prev) => ({ ...prev, error: "Failed to load default PDF" }))
      );
  }, []);


  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-gray-900 text-white transition-all duration-300 ${
        state.isFullscreen ? "fixed inset-0 z-50 p-2" : "p-4"
      }`}
    >
      <TopBar
        state={state}
        handleDurationChange={handleDurationChange}
        goToPage={goToPage}
        toggleFullscreen={toggleFullscreen}
        togglePlayPause={togglePlayPause}
      />

      <PdfViewer
        state={state}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        onDocumentLoadSuccess={onDocumentLoadSuccess}
        onDocumentLoadError={onDocumentLoadError}
        onPageRenderError={onPageRenderError}
        isTransitioning={isTransitioning}
      />
    </div>
  );
};

export default PDFSlideshowReader;
