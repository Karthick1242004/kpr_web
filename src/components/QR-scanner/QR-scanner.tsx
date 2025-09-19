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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
        >
          Scan Barcode / QR Code
        </button>
      ) : (
        <>
          {/* keep video responsive in 4:3 ratio */}
          <div className="relative w-full max-w-md mx-auto aspect-[4/3]">
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              className="w-full h-full rounded-lg bg-gray-800 object-cover"
            />
          </div>
          <button
            onClick={handleCloseScanner}
            className="bg-gray-600 hover:bg-gray-700 text-white mt-4 px-4 py-2 rounded-lg transition-colors"
          >
            Stop Scanner
          </button>
        </>
      )}
      {result && (
        <div className="bg-green-800 border border-green-600 rounded-lg p-4 mt-4">
          <div className="text-green-200">
            <strong>Scanned {scanType}:</strong>
          </div>
          <div className="mt-2 text-green-100 break-all">{result}</div>
        </div>
      )}
      {error && (
        <div className="bg-red-800 border border-red-600 rounded-lg p-4 mt-3">
          <div className="text-red-200">
            <strong>Error:</strong> {error}
          </div>
          {error.includes("NotAllowedError") && (
            <div className="text-sm mt-1 text-red-300">
              Please allow camera permissions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}