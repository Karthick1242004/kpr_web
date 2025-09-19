# PDF Reader with QR Scanner

A modern React application that allows you to scan QR codes containing PDF links and automatically displays them in a slideshow format.

## Features

### 🔍 QR Scanner Page
- **QR/Barcode scanning** using device camera
- **Google Drive link support** - automatically converts sharing links to direct download links
- **Direct PDF URL support** - handles any direct PDF file URLs
- **Real-time validation** - checks if scanned links are accessible PDF files
- **Error handling** - provides clear feedback for invalid or inaccessible links

### 📄 PDF Viewer Page
- **Automatic slideshow** - PDF pages advance automatically with configurable timing
- **Manual controls** - play/pause, previous/next page navigation
- **Fullscreen mode** - immersive viewing experience
- **Keyboard shortcuts** - spacebar (play/pause), arrow keys (navigation), F key (fullscreen)
- **Responsive design** - works on desktop and mobile devices

## Technology Stack

- **React 19.1.1** - Latest React with modern features
- **TypeScript 5.8.3** - Full type safety
- **Vite 7.1.2** - Fast build tool and development server
- **Tailwind CSS 4.1.13** - Modern utility-first CSS framework
- **react-pdf 10.1.0** - PDF rendering
- **@zxing/browser** - QR/barcode scanning
- **Lucide React** - Modern icon library

## Getting Started

### Prerequisites
- Node.js 18+ 
- Camera-enabled device for QR scanning

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-reader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Allow camera permissions when prompted

## Usage

### Scanning QR Codes

1. **Open the application** - you'll start on the QR Scanner page
2. **Click "Scan Barcode / QR Code"** to activate your camera
3. **Point your camera** at a QR code containing a PDF link
4. **Wait for automatic detection** - the app will process the scanned content
5. **Automatic navigation** - if successful, you'll be taken to the PDF viewer

### Supported QR Code Formats

#### Shortened URLs (NEW!)
```
https://scan.page/p/UV24Xt
https://bit.ly/example-pdf
https://tinyurl.com/pdf-link
```
*Automatically resolved to destination URLs*

#### Google Drive Links
```
https://drive.google.com/file/d/1ABC123def456GHI789/view?usp=sharing
```
*Automatically converted to direct download link*

#### Direct PDF URLs
```
https://example.com/document.pdf
https://mysite.com/files/presentation.pdf
```
*Used directly for PDF loading*

### PDF Viewer Controls

#### Top Bar Controls
- **Duration Input** - Set slideshow timing (seconds per page)
- **Previous/Next** - Manual page navigation
- **Play/Pause** - Start/stop automatic slideshow
- **Page Counter** - Shows current page / total pages
- **Fullscreen** - Toggle fullscreen mode
- **Back Button** - Return to QR scanner

#### Keyboard Shortcuts
- `Spacebar` - Play/pause slideshow
- `←/→ Arrow Keys` - Navigate pages
- `F` - Toggle fullscreen
- `Escape` - Exit fullscreen

## Project Structure

```
src/
├── components/
│   ├── QR-scanner/
│   │   └── QR-scanner.tsx     # QR scanning component
│   ├── file-upload.tsx        # File upload component
│   ├── pdf-viewer.tsx         # PDF display component
│   └── top-bar.tsx           # Control bar component
├── pages/
│   ├── QRScannerPage.tsx     # Main scanner page
│   └── PDFViewerPage.tsx     # PDF slideshow page
├── types/
│   └── pdf-reader.ts         # TypeScript interfaces
├── App.tsx                   # Main app with routing
├── main.tsx                  # React entry point
└── index.css                 # Tailwind imports
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Browser Compatibility

- **Modern browsers** with camera API support
- **HTTPS required** for camera access (development server uses HTTP locally)
- **WebRTC support** required for camera functionality

## Troubleshooting

### Camera Not Working
- Ensure you've granted camera permissions
- Check if other applications are using the camera
- Try refreshing the page
- Use HTTPS in production (required for camera access)

### PDF Not Loading
- Verify the QR code contains a valid PDF URL
- Check if the PDF URL is publicly accessible
- Ensure the server supports CORS for cross-origin requests
- For Google Drive links, make sure sharing is enabled

### Google Drive Issues
- Ensure the Google Drive file is publicly shared
- Use the sharing link (not the direct Drive interface link)
- Some corporate Google accounts may have restrictions

### Shortened URL Issues
- scan.page URLs are automatically resolved to their destination
- If scan.page resolution fails, try using the direct Google Drive link
- Some URL shorteners may block automated access (CORS restrictions)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [react-pdf](https://github.com/wojtekmaj/react-pdf) for PDF rendering
- [ZXing](https://github.com/zxing-js/browser) for QR/barcode scanning
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons