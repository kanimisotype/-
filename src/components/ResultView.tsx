import React, { useState } from 'react';
import { Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import './ResultView.css';

interface ResultViewProps {
  originalImage: string;
  resultImage: string | null;
  onReset: () => void;
  message: string;
  progress?: { progress: number };
}

export const ResultView: React.FC<ResultViewProps> = ({
  originalImage,
  resultImage,
  onReset,
  message,
  progress
}) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = 'transparent_image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="result-container animate-fade-in">
      <div className="image-preview-area glass-panel">
        {resultImage ? (
          <div className="image-wrapper checkerboard">
            <img 
              src={showOriginal ? originalImage : resultImage} 
              alt="Preview" 
              className="preview-image animate-fade-in" 
            />
          </div>
        ) : (
          <div className="image-wrapper processing-wrapper">
            <img src={originalImage} alt="Original" className="preview-image blur-sm" />
            <div className="processing-overlay">
              <div className="loader"></div>
              <p className="status-message">{message}</p>
              {progress && progress.progress !== undefined && (
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="controls-area">
        {resultImage && (
          <>
            <div 
              className="toggle-wrapper animate-fade-in" 
              onMouseEnter={() => setShowOriginal(true)} 
              onMouseLeave={() => setShowOriginal(false)} 
              onTouchStart={() => setShowOriginal(true)} 
              onTouchEnd={() => setShowOriginal(false)}
            >
              <div className="toggle-label glass-panel">
                <ImageIcon size={18} />
                <span>長押し（ホバー）で元画像を表示</span>
              </div>
            </div>
            
            <div className="action-buttons animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <button className="btn-secondary" onClick={onReset}>
                <RefreshCw size={20} />
                やり直す
              </button>
              <button className="btn-primary pulse-btn" onClick={handleDownload}>
                <Download size={20} />
                ダウンロード
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
