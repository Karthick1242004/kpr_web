import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

interface QRScannerProps {
  setSearchTerm?: (term: string) => void;
  onClose?: () => void;
}

export default function QRScanner({ setSearchTerm, onClose }: QRScannerProps) {
  const [active, setActive] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [scanType, setScanType] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null); // ZXing controls type is not well-defined

  /* ---------- open scanner ---------- */
  const handleOpenScanner = async (): Promise<void> => {
    setError("");
    setResult("");
    setScanType("");
    setActive(true);
    await new Promise<void>((r) => setTimeout(r, 50));
    
    if (!videoRef.current) {
      setError("Video element not available");
      setActive(false);
      return;
    }
    
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    
    try {
      controlsRef.current = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            setSearchTerm?.(""); // clear first
            setSearchTerm?.(result.getText());
            setResult(result.getText());
            setScanType(result.getBarcodeFormat().toString());
            handleCloseScanner();
            onClose?.();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("Scanner error:", err);
            setError(`Scanning error: ${err.message || String(err)}`);
          }
        }
      );
    } catch (e: any) {
      setError(e.message || String(e));
      setActive(false);
    }
  };

  /* ---------- close scanner ---------- */
  const handleCloseScanner = async (): Promise<void> => {
    try {
      /* 1️⃣ stop via ZXing controls (if we already have them) */
      await controlsRef.current?.stop?.();
      /* 2️⃣ make 100% sure every MediaStreamTrack is stopped */
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null; // detach stream from <video>
        }
      }
    } catch (err) {
      console.warn("Error while stopping camera:", err);
    } finally {
      setActive(false); // hide preview / show button
    }
  };

  useEffect(() => {
    return () => {
      handleCloseScanner();
    };
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="text-center p-3">
      {!active ? (
        <button
          onClick={handleOpenScanner}
          className="btn btn-primary px-4 py-2 fs-6"
        >
          Scan Barcode / QR Code
        </button>
      ) : (
        <>
          {/* keep video responsive in 4:3 ratio */}
          <div className="ratio ratio-4x3 w-100 mx-auto" style={{ maxWidth: 400 }}>
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              className="w-100 h-100 rounded bg-dark"
            />
          </div>
          <button
            onClick={handleCloseScanner}
            className="btn btn-outline-secondary mt-3 px-3 py-2"
          >
            Stop Scanner
          </button>
        </>
      )}
      {result && (
        <div className="alert alert-success mt-4">
          <strong>Scanned {scanType}:</strong>
          <div className="mt-2 text-break">{result}</div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {error}
          {error.includes("NotAllowedError") && (
            <div className="small mt-1">
              Please allow camera permissions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}