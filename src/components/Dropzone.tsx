import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import './Dropzone.css';

interface DropzoneProps {
  onImageSelected: (file: File) => void;
  isProcessing: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onImageSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (isProcessing) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          onImageSelected(file);
        }
      }
    },
    [onImageSelected, isProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing) return;
      
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        onImageSelected(file);
      }
    },
    [onImageSelected, isProcessing]
  );

  return (
    <div 
      className={`dropzone-container glass-panel animate-fade-in ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        id="file-upload"
        className="hidden-input"
        disabled={isProcessing}
      />
      
      <div className="icon-wrapper">
        {isDragging ? (
          <ImageIcon size={64} className="drop-icon active" />
        ) : (
          <UploadCloud size={64} className="drop-icon pulse" />
        )}
      </div>
      
      <h3 className="drop-title">
        {isDragging ? 'ここにドロップしてアップロード' : '画像を選択するか、ドラッグ＆ドロップ'}
      </h3>
      <p className="drop-subtitle">PNG, JPG, WEBP に対応</p>
      
      <div className="btn-primary select-btn">
        画像を選択
      </div>
    </div>
  );
};
