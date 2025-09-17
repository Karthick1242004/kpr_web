export interface PDFReaderState {
  file: File | null;
  fileName:string;
  numPages: number;
  currentPage: number;
  duration: number;
  isPlaying: boolean;
  isFullscreen: boolean;
  progress: number;
  isLoading: boolean;
  error: string | null;
}

export interface TopBarProps {
  state: PDFReaderState;
  handleDurationChange: (newDuration: number) => void;
  toggleFullscreen: () => Promise<void>;
  goToPage: (page: number) => void;
  togglePlayPause: () => void;
}

export interface PdfViewerProps {
  state: PDFReaderState;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement> | File) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onPageRenderError: (error: Error) => void;
  isTransitioning: boolean;
}

export interface FileUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement> | File) => void;
}
