
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
    "Capturing HD Medical Frames...",
    "Isolating Handwritten Regions...",
    "Applying Neural Denoising...",
    "Decoding Clinical Sig Codes...",
    "Verifying Drug Safety Profiles...",
    "Finalizing Health Directive..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 1400);
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
      setPreviewUrl(canvasRef.current.toDataURL('image/jpeg', 0.95));
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
      <div className="bg-white rounded-[3.5rem] border-8 border-slate-100 shadow-2xl overflow-hidden min-h-[580px] flex flex-col relative group">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
             {/* Scanning Laser Line Effect */}
             <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="w-full h-[2px] bg-blue-500 shadow-[0_0_15px_blue] absolute top-0 animate-scan-line"></div>
             </div>

             <div className="relative mb-12">
                <div className="w-40 h-40 border-[16px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl">🔬</div>
             </div>
             
             <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Reading Notes...</h3>
             <div className="w-full max-w-sm space-y-4">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                   <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}></div>
                </div>
                <p className="text-blue-600 text-lg font-black italic animate-pulse tracking-tight h-8">
                   {stages[loadingStage]}
                </p>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-8">
            <div className="text-center mb-4">
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Clinical Prescription Scan</h3>
               <p className="text-slate-500 font-bold text-lg mt-2 italic">Ensure good lighting for handwriting detection</p>
            </div>

            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-xl active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="text-9xl group-hover:scale-110 transition-transform relative z-10 drop-shadow-2xl">📸</div>
              <div className="text-center relative z-10">
                <span className="block text-4xl font-black tracking-tighter">Capture Photo</span>
                <span className="text-sm opacity-80 font-black uppercase tracking-[0.3em] mt-2 block">AI Handwriting Optimized</span>
              </div>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-8 bg-slate-50 text-slate-700 rounded-[2rem] font-black text-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-white transition-all flex items-center justify-center gap-4"
            >
              <span className="text-2xl">🖼️</span> Upload from Gallery
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-12">
               <div className="w-full h-full border-4 border-white/40 border-dashed rounded-[3rem] relative shadow-[0_0_150px_rgba(0,0,0,0.6)_inset]">
                  <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-blue-500 rounded-tl-3xl"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-blue-500 rounded-tr-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-blue-500 rounded-bl-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-blue-500 rounded-br-3xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10">
                       <p className="text-white font-black text-xs uppercase tracking-widest text-center">Place Prescription within Frame</p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12">
              <button onClick={() => { stopCamera(); setMode('idle'); }} className="w-16 h-16 bg-white/10 backdrop-blur-xl text-white rounded-full text-2xl border border-white/20 shadow-lg">✕</button>
              <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-all flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full"></div>
              </button>
              <div className="w-16 h-16"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-8 bg-white">
            <div className="text-center mb-6">
               <h4 className="text-3xl font-black text-slate-800 tracking-tighter">Handwriting Review</h4>
               <p className="text-slate-400 font-bold">Ensure clinical notes are readable</p>
            </div>
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50">
              <img src={previewUrl} className="w-full h-full object-contain" />
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Sharp Input</div>
            </div>
            <div className="mt-8 flex gap-4">
               <button onClick={() => setMode('idle')} className="flex-1 py-6 bg-slate-100 text-slate-600 rounded-[1.8rem] font-black text-xl">Retake</button>
               <button onClick={() => onUpload(previewUrl)} className="flex-[2] py-6 bg-blue-600 text-white rounded-[1.8rem] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all">Analyze Prescription</button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 2.5s infinite linear;
        }
      `}} />
    </div>
  );
};

export default PrescriptionUpload;
