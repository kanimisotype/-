import { useState, useEffect, useCallback } from 'react';
import { Dropzone } from './components/Dropzone';
import { ResultView } from './components/ResultView';
import { Sparkles, Info, Layers, Beaker } from 'lucide-react';
import './App.css';

// Worker instance
let worker: Worker | null = null;

function App() {
  const [activeTab, setActiveTab] = useState<'remove-bg' | 'upcoming'>('remove-bg');
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<{ progress: number } | undefined>(undefined);

  // Initialize Web Worker
  useEffect(() => {
    worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.addEventListener('message', (event) => {
      const data = event.data;
      
      switch (data.type) {
        case 'status':
          setMessage(data.message);
          break;
        case 'progress':
          if (data.data && data.data.status === 'progress') {
            setProgress({ progress: data.data.progress });
          }
          break;
        case 'complete':
          setResultImage(data.url);
          setIsProcessing(false);
          break;
        case 'error':
          setMessage(`エラー: ${data.error}`);
          setIsProcessing(false);
          alert(`エラーが発生しました: ${data.error}`);
          break;
      }
    });

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  const handleImageSelected = useCallback((file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setOriginalImage(imageUrl);
    setResultImage(null);
    setIsProcessing(true);
    setMessage('処理を準備中...');
    setProgress(undefined);

    // Send image to worker
    if (worker) {
      worker.postMessage({ id: Date.now(), imageUrl });
    }
  }, []);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setResultImage(null);
    setIsProcessing(false);
    setMessage('');
    setProgress(undefined);
  }, []);

  return (
    <div className="app-main">
      <header className="app-header glass-panel animate-fade-in">
        <div className="title-section">
          <Sparkles className="header-icon pulse-icon" size={28} />
          <h1>背景透過サービス</h1>
        </div>
        
        {/* タブナビゲーション */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'remove-bg' ? 'active' : ''}`}
            onClick={() => setActiveTab('remove-bg')}
          >
            <Layers size={18} />
            背景透過
          </button>
          <button 
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Beaker size={18} />
            新機能準備中
          </button>
        </div>
      </header>
      
      <main className="app-content">
        <div className="content-wrapper">
          {activeTab === 'remove-bg' && (
            <>
              <div className="info-banner glass-panel animate-fade-in text-sm" style={{ animationDelay: '0.1s' }}>
                <Info size={18} className="info-icon" />
                <p>画像はサーバーに送信されず、すべてお使いのデバイス上で安全に処理されます。</p>
              </div>

              <div className="workspace-area animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {!originalImage ? (
                  <Dropzone onImageSelected={handleImageSelected} isProcessing={isProcessing} />
                ) : (
                  <ResultView 
                    originalImage={originalImage}
                    resultImage={resultImage}
                    onReset={handleReset}
                    message={message}
                    progress={progress}
                  />
                )}
              </div>
            </>
          )}

          {activeTab === 'upcoming' && (
            <div className="upcoming-feature-area glass-panel animate-fade-in">
              <Beaker size={64} className="text-muted mb-4" />
              <h2>新しい機能を準備中です！</h2>
              <p className="text-muted mt-2">画質アップや不要物消去機能などを今後追加予定です。</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="app-footer animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <p>AI Powered In-Browser Processing</p>
      </footer>
    </div>
  );
}

export default App;
