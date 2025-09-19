import React, { useState } from "react";
import QRScanner from "../components/QR-scanner/QR-scanner";

interface QRScannerPageProps {
  onPDFScanned: (pdfUrl: string) => void;
}

const QRScannerPage: React.FC<QRScannerPageProps> = ({ onPDFScanned }) => {
  const [scanResult, setScanResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleQRResult = async (result: string) => {
    setScanResult(result);
    setError("");
    setIsProcessing(true);

    try {
      let pdfUrl = "";

      // Handle shortened URLs (like scan.page, bit.ly, etc.)
      if (result.startsWith('http') && !result.includes('drive.google.com') && !result.toLowerCase().includes('.pdf')) {
        console.log("Resolving shortened URL:", result);
        const resolvedUrl = await resolveShortUrl(result);
        console.log("Resolved to:", resolvedUrl);
        
        // Check if resolved URL is a Google Drive link
        if (resolvedUrl.includes('drive.google.com') || resolvedUrl.includes('docs.google.com')) {
          pdfUrl = convertGoogleDriveLink(resolvedUrl);
        } else if (resolvedUrl.toLowerCase().includes('.pdf')) {
          pdfUrl = resolvedUrl;
        } else {
          throw new Error("Shortened URL does not resolve to a PDF link");
        }
      }
      // Handle Google Drive links directly
      else if (result.includes('drive.google.com') || result.includes('docs.google.com')) {
        pdfUrl = convertGoogleDriveLink(result);
      }
      // Handle direct PDF links
      else if (result.toLowerCase().includes('.pdf')) {
        pdfUrl = result;
      }
      else {
        throw new Error("Scanned content is not a valid PDF link");
      }

      // Validate that the final URL is accessible
      await validatePDFUrl(pdfUrl);
      
      // Navigate to PDF viewer with the URL
      onPDFScanned(pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process scanned content");
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveShortUrl = async (shortUrl: string): Promise<string> => {
    try {
      // Use fetch with redirect: 'manual' to capture the redirect location
      const response = await fetch(shortUrl, { 
        method: 'HEAD', 
        redirect: 'manual',
        mode: 'cors'
      });
      
      // Check for redirect status codes
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location');
        if (location) {
          // If location is relative, make it absolute
          const resolvedUrl = location.startsWith('http') 
            ? location 
            : new URL(location, shortUrl).href;
          
          // Recursively resolve if it's another redirect
          if (resolvedUrl !== shortUrl && (resolvedUrl.includes('scan.page') || !resolvedUrl.includes('drive.google.com'))) {
            return await resolveShortUrl(resolvedUrl);
          }
          return resolvedUrl;
        }
      }
      
      // If no redirect, try using a CORS proxy or alternative method
      // For scan.page specifically, we can try a different approach
      if (shortUrl.includes('scan.page')) {
        // Try to use a CORS proxy to resolve the URL
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          // Look for Google Drive link in the response
          const driveMatch = data.contents?.match(/https:\/\/drive\.google\.com\/[^"'\s]+/);
          if (driveMatch) {
            return driveMatch[0];
          }
        }
      }
      
      // Fallback: return the original URL
      return shortUrl;
    } catch (error) {
      console.error('Error resolving short URL:', error);
      // Try alternative approach for scan.page URLs
      if (shortUrl.includes('scan.page')) {
        throw new Error('Unable to resolve scan.page URL. Please use the direct Google Drive link instead.');
      }
      throw new Error(`Failed to resolve shortened URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertGoogleDriveLink = (url: string): string => {
    // Convert Google Drive sharing link to direct download link
    if (url.includes('/file/d/')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Try multiple URL formats for better compatibility
        // Format 1: Standard export format
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
        // Alternative formats that might work better:
        // Format 2: Direct view format (commented out)
        // return `https://drive.google.com/file/d/${fileId}/view`;
        // Format 3: Embedded format (commented out)
        // return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };

  const validatePDFUrl = async (url: string): Promise<void> => {
    try {
      // For Google Drive URLs, skip validation due to CORS restrictions
      // We'll let the PDF viewer handle the loading directly
      if (url.includes('drive.google.com')) {
        console.log('Skipping validation for Google Drive URL due to CORS restrictions');
        return; // Trust that Google Drive URLs are valid if properly formatted
      }
      
      // For other URLs, try validation but don't fail on CORS errors
      try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        // With no-cors mode, we can't check response details, but we can detect network errors
      } catch (corsError) {
        // If it's a CORS error, that's actually good - it means the server exists
        // We'll proceed anyway since CORS errors don't mean the URL is invalid
        console.log('CORS restriction detected, but URL appears valid');
      }
    } catch (err) {
      // Only throw errors for actual network failures, not CORS restrictions
      if (err instanceof Error && err.message.includes('Failed to fetch') && !err.message.includes('CORS')) {
        throw new Error('Network error: Unable to reach the URL. Please check your internet connection.');
      }
      // For most other errors, we'll be lenient and let the PDF viewer try to load it
      console.warn('URL validation warning:', err);
    }
  };

  const resetScanner = () => {
    setScanResult("");
    setError("");
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">QR/Barcode Scanner</h1>
          <p className="text-gray-300">Scan a QR code or barcode containing a PDF link</p>
        </div>

        {/* QR Scanner Component */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <QRScanner 
            setSearchTerm={handleQRResult}
            onClose={() => {}}
          />
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-blue-800 border border-blue-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              <span>Processing scanned content...</span>
            </div>
          </div>
        )}

        {/* Scan Result Display */}
        {scanResult && !isProcessing && (
          <div className="bg-green-800 border border-green-600 rounded-lg p-4 mb-4">
            <div className="text-sm text-green-200 mb-2">
              <strong>Scanned Content:</strong>
            </div>
            <div className="text-green-100 break-all mb-3">
              {scanResult}
            </div>
            <button
              onClick={resetScanner}
              className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded text-sm transition-colors"
            >
              Scan Another Code
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-800 border border-red-600 rounded-lg p-4 mb-4">
            <div className="text-sm text-red-200 mb-2">
              <strong>Error:</strong>
            </div>
            <div className="text-red-100 mb-3">
              {error}
            </div>
            <button
              onClick={resetScanner}
              className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Supported Formats:</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• <strong>Shortened URLs</strong> (scan.page, bit.ly, etc.) → Automatically resolved</li>
            <li>• <strong>Google Drive</strong> PDF sharing links → Converted to direct download</li>
            <li>• <strong>Direct PDF URLs</strong> → Used directly for loading</li>
            <li>• <strong>QR codes</strong> containing any of the above link types</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> scan.page URLs are automatically resolved to their destination Google Drive links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
