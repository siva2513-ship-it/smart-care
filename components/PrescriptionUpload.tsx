
import React, { useState, useRef, useEffect } from 'react';

interface PrescriptionUploadProps {
  onUpload: (file: string) => void;
  isProcessing: boolean;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onUpload, isProcessing }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [decipherProgress, setDecipherProgress] = useState(0);
  const [hudScale, setHudScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stages = [
    "Reading Rx...",
    "Syncing Schedule...",
    "Finalizing..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      setDecipherProgress(15);
      // HYPER-SPEED: 100ms UI feedback loop
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
        setDecipherProgress(p => Math.min(p + 12, 99)); 
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      setMode('idle');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const processAndUpload = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // HYPER-EFFICIENCY: 800px is excellent for Gemini 3 Flash and extremely fast over network
      const MAX_WIDTH = 800; 
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = 'contrast(1.2) brightness(1.05) saturate(1.1)';
        ctx.drawImage(img, 0, 0, width, height);
        // High compression for sub-second upload
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        onUpload(compressedDataUrl);
      }
    };
    img.src = dataUrl;
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewUrl(dataUrl);
        setMode('preview');
        stopCamera();
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-3xl overflow-hidden min-h-[580px] flex flex-col relative transition-all duration-300">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
             <div className="w-full h-[8px] bg-blue-500 shadow-[0_0_40px_#3b82f6] absolute top-0 animate-scan-line"></div>
             <div className="relative mb-8">
                <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">💊</div>
             </div>
             <h3 className="text-xl font-black text-white tracking-widest uppercase italic">Analyzing Now</h3>
             <div className="w-full max-w-xs space-y-3 mt-6">
                <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-widest">
                   <span>{stages[loadingStage]}</span>
                   <span>{decipherProgress}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${decipherProgress}%` }}></div>
                </div>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-10 space-y-8 text-center">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Instant Medication<br/><span className="text-blue-600">Scan.</span></h3>
            <button onClick={startCamera} className="flex-1 bg-blue-600 text-white rounded-[3rem] flex flex-col items-center justify-center space-y-4 hover:scale-105 transition-all shadow-2xl active:scale-95 group">
              <div className="text-8xl">📸</div>
              <span className="block text-2xl font-black tracking-tighter">Fast Analyze</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="py-6 bg-slate-50 text-slate-500 rounded-[2rem] font-black text-lg border-2 border-slate-100">
              📂 Fast Import
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => { setPreviewUrl(ev.target?.result as string); setMode('preview'); };
                reader.readAsDataURL(file);
              }
            }} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-10">
              <button onClick={() => { stopCamera(); setMode('idle'); }} className="w-14 h-14 bg-white/10 backdrop-blur-xl text-white rounded-full">✕</button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-blue-600 active:scale-90 transition-all">
                <div className="w-full h-full bg-blue-600 rounded-full scale-75"></div>
              </button>
              <div className="w-14 h-14"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-10 bg-white">
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50 flex items-center justify-center">
              <img src={previewUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
            </div>
            <div className="mt-8 flex gap-4">
               <button onClick={() => setMode('idle')} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black">Retake</button>
               <button onClick={() => processAndUpload(previewUrl)} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl">Verify & Sync</button>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PrescriptionUpload;
