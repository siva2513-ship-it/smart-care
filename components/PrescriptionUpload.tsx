
import React, { useState, useRef, useEffect } from 'react';

interface PrescriptionUploadProps {
  onUpload: (file: File | string) => void;
  isProcessing: boolean;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onUpload, isProcessing }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stages = [
    "Locking Focus...",
    "Extracting Sig Codes...",
    "Decoding Handwriting...",
    "Pharma Cross-Check...",
    "Generating Guide..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 700); // Faster interval for Flash model
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access required for clinical scanning.");
      setMode('idle');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      canvasRef.current.getContext('2d')?.drawImage(video, 0, 0);
      setPreviewUrl(canvasRef.current.toDataURL('image/jpeg', 0.98));
      setMode('preview');
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setPreviewUrl(ev.target?.result as string); setMode('preview'); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-3xl overflow-hidden min-h-[640px] flex flex-col relative group">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
             <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
                <div className="w-full h-[12px] bg-blue-500 shadow-[0_0_40px_#3b82f6] absolute top-0 animate-scan-line-ultra"></div>
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20">
                  {[...Array(144)].map((_, i) => (
                    <div key={i} className="border-[0.25px] border-blue-400"></div>
                  ))}
                </div>
             </div>

             <div className="relative mb-12 scale-110">
                <div className="w-48 h-48 border-[16px] border-blue-500 border-t-transparent rounded-full animate-spin duration-700"></div>
                <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]">⚡</div>
             </div>
             
             <h3 className="text-4xl font-black text-white tracking-tighter mb-4">Neural High-Speed Extraction</h3>
             <div className="w-full max-w-xs space-y-4">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/20 shadow-inner">
                   <div className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_20px_#3b82f6]" style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}></div>
                </div>
                <p className="text-blue-400 text-lg font-black italic animate-pulse tracking-tight h-8">
                   {stages[loadingStage]}
                </p>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-8 bg-white">
            <div className="text-center mb-4">
               <div className="inline-block px-5 py-2 bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] rounded-full mb-6 border border-blue-100">Flash Engine v3.0</div>
               <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">Quick Scan</h3>
               <p className="text-slate-500 font-bold text-lg max-w-sm mx-auto italic leading-tight">Instant prescription detection with clinical-grade accuracy.</p>
            </div>

            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3.5rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-2xl active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="text-9xl group-hover:scale-110 transition-transform duration-300 relative z-10">📷</div>
              <div className="text-center relative z-10">
                <span className="block text-4xl font-black tracking-tighter">Start Instant Scan</span>
                <span className="text-[10px] opacity-70 font-black uppercase tracking-[0.5em] mt-3 block">Real-time Vision Processing</span>
              </div>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-8 bg-slate-50 text-slate-700 rounded-[2.5rem] font-black text-xl border-4 border-slate-100 hover:border-blue-400 hover:bg-white transition-all flex items-center justify-center gap-4 shadow-sm"
            >
              <span>📂</span> Choose from Phone Gallery
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-12">
               <div className="w-full h-full border-4 border-white/20 rounded-[3.5rem] relative">
                  <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-blue-500 rounded-tl-[3.5rem]"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-blue-500 rounded-tr-[3.5rem]"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-blue-500 rounded-bl-[3.5rem]"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-blue-500 rounded-br-[3.5rem]"></div>
                  
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-blue-600 px-8 py-3 rounded-full border border-white/40 shadow-2xl">
                    <p className="text-white font-black text-[10px] uppercase tracking-[0.4em]">Ready for Capture</p>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12">
              <button onClick={() => { stopCamera(); setMode('idle'); }} className="w-16 h-16 bg-white/10 backdrop-blur-2xl text-white rounded-full text-2xl border border-white/20">✕</button>
              <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full border-[10px] border-blue-600 shadow-[0_0_60px_rgba(37,99,235,0.7)] active:scale-90 transition-all flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full animate-pulse"></div>
              </button>
              <div className="w-16 h-16"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-10 bg-white">
            <div className="text-center mb-8">
               <h4 className="text-4xl font-black text-slate-900 tracking-tighter">Scan Verification</h4>
               <p className="text-slate-500 font-bold">Checking readability for Flash extraction...</p>
            </div>
            <div className="flex-1 relative rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-inner bg-slate-100">
              <img src={previewUrl} className="w-full h-full object-contain" alt="Prescription" />
              <div className="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>
            </div>
            <div className="mt-10 flex gap-6">
               <button onClick={() => setMode('idle')} className="flex-1 py-8 bg-slate-100 text-slate-600 rounded-[2.5rem] font-black text-2xl">Retake</button>
               <button onClick={() => onUpload(previewUrl)} className="flex-[2] py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-blue-700 active:scale-95 transition-all">Begin Flash Analysis</button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line-ultra {
          0% { top: -5%; }
          100% { top: 105%; }
        }
        .animate-scan-line-ultra {
          animation: scan-line-ultra 1.5s infinite linear;
        }
      `}} />
    </div>
  );
};

export default PrescriptionUpload;
