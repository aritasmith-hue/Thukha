import React, { useState, useCallback, useMemo } from 'react';
import { UploadedFile } from '../types';
import { UploadIcon, FileIcon, CloseIcon } from './icons';

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const FilePreview: React.FC<{ uploadedFile: UploadedFile; onRemove: (id: string) => void }> = ({ uploadedFile, onRemove }) => {
  const isImage = uploadedFile.file.type.startsWith('image/');
  
  return (
    <div className="relative group w-full bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center space-x-3 transition-shadow hover:shadow-md">
      <div className="flex-shrink-0 h-12 w-12 rounded-md flex items-center justify-center bg-gray-100">
        {isImage ? (
          <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="h-full w-full object-cover rounded-md" />
        ) : (
          <FileIcon className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{uploadedFile.file.name}</p>
        <p className="text-xs text-gray-500">{Math.round(uploadedFile.file.size / 1024)} KB</p>
      </div>
      <button
        onClick={() => onRemove(uploadedFile.id)}
        className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
        aria-label="Remove file"
      >
        <CloseIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

export const FileUpload: React.FC<FileUploadProps> = ({ files: uploadedFiles, onFilesChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file)
      }));
      const updatedFiles = [...uploadedFiles, ...newFiles];
      onFilesChange(updatedFiles);
    }
  }, [uploadedFiles, onFilesChange]);
  
  const handleRemoveFile = useCallback((id: string) => {
    const newFiles = uploadedFiles.filter(f => f.id !== id);
    onFilesChange(newFiles);
    // Revoke object URL to free memory
    const fileToRevoke = uploadedFiles.find(f => f.id === id);
    if (fileToRevoke) {
        URL.revokeObjectURL(fileToRevoke.preview);
    }
  }, [uploadedFiles, onFilesChange]);

  const dropzoneBg = useMemo(() => {
    if (isDragging) return 'bg-teal-100/50 border-teal-500';
    return 'bg-gray-50 border-gray-300';
  }, [isDragging]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
     if (files && files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file)
      }));
      const updatedFiles = [...uploadedFiles, ...newFiles];
      onFilesChange(updatedFiles);
    }
  };


  return (
    <div>
      <label 
        className={`flex justify-center w-full h-40 px-4 transition-all duration-300 border-2 ${dropzoneBg} border-dashed rounded-md appearance-none cursor-pointer hover:border-teal-400 focus:outline-none`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="flex flex-col items-center justify-center space-y-2">
            <UploadIcon className="w-10 h-10 text-gray-400"/>
            <span className="font-medium text-gray-600 text-center">
                Drop files to Attach, or <span className="text-teal-600 underline">browse</span>
            </span>
             <span className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</span>
        </span>
        <input
            type="file"
            name="file_upload"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept="image/png, image/jpeg, application/pdf"
        />
      </label>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2">
          <h3 className="text-sm font-semibold text-gray-600">Uploaded Files:</h3>
          {uploadedFiles.map(uploadedFile => (
            <FilePreview key={uploadedFile.id} uploadedFile={uploadedFile} onRemove={handleRemoveFile} />
          ))}
        </div>
      )}
    </div>
  );
};