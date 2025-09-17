import { Upload } from "lucide-react";
import type { FileUploadProps } from "../types/pdf-reader";

const FileUpload = ({ fileInputRef, handleFileUpload }:FileUploadProps) => {
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      handleFileUpload(droppedFile);
    }
  };

  return (
    <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 w-xl">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div
          className="cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Click to browse files
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
