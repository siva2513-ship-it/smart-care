
import React, { useState, useRef, useEffect } from 'react';

interface PrescriptionUploadProps {
  onUpload: (file: File | string) => void;
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
    "Locking Clinical Region...",
    "Extracting Ink Patterns...",
    "Deciphering Handwriting...",
    "Resolving Doctor's Sig...",
    "Cross-referencing Pharma DB...",
    "Optimizing Regimen Timings..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      setDecipherProgress(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
        setDecipherProgress(p => Math.min(p + 15, 100));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (mode === 'camera') {
      const interval = setInterval(() => {
        setHudScale(0.99 + Math.random() * 0.02);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 4096 }, 
          height: { ideal: 2160 } 
        } 
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
      setPreviewUrl(canvasRef.current.toDataURL('image/jpeg', 0.9));
      setMode('preview');
      stopCamera();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-3xl overflow-hidden min-h-[680px] flex flex-col relative group">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-slate-900/98 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
             <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="w-full h-[10px] bg-blue-500 shadow-[0_0_40px_#3b82f6] absolute top-0 animate-scan-line"></div>
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-5">
                  {[...Array(144)].map((_, i) => (
                    <div key={i} className="border-[0.5px] border-blue-400"></div>
                  ))}
                </div>
             </div>

             <div className="relative mb-12">
                <div className="w-32 h-32 border-[8px] border-blue-500/10 rounded-full"></div>
                <div className="absolute inset-0 w-32 h-32 border-[8px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🧬</div>
             </div>
             
             <h3 className="text-3xl font-black text-white tracking-tighter mb-4 italic">Forensic Analysis Active</h3>
             <div className="w-full max-w-sm space-y-4">
                <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">
                   <span>{stages[loadingStage]}</span>
                   <span>{decipherProgress}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                   <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${decipherProgress}%` }}></div>
                </div>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-10 bg-white">
            <div className="text-center">
               <div className="inline-block px-5 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-8">Forensic OCR v4.2</div>
               <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Clinical<br/><span className="text-blue-600">Scan Engine.</span></h3>
               <p className="text-slate-400 font-bold text-lg max-w-sm mx-auto">Map your prescription to an automated care schedule.</p>
            </div>

            <button onClick={startCamera} className="flex-1 bg-blue-600 text-white rounded-[3rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-3xl active:scale-95 group overflow-hidden">
              <div className="text-9xl group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">📸</div>
              <div className="text-center">
                <span className="block text-3xl font-black tracking-tighter">Start Adherence Scan</span>
                <span className="text-[10px] opacity-70 font-black uppercase tracking-[0.6em] mt-2 block">Ultra-Res Vision Active</span>
              </div>
            </button>
            
            <button onClick={() => fileInputRef.current?.click()} className="py-8 bg-slate-50 text-slate-500 rounded-[2.5rem] font-black text-xl border-4 border-slate-100 hover:bg-white transition-all flex items-center justify-center gap-4">
              📂 Choose Gallery
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
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-12">
               <div className="w-full h-full border-2 border-white/20 rounded-[3rem] relative transition-transform" style={{ transform: `scale(${hudScale})` }}>
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-[3rem]"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-[3rem]"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-[3rem]"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-[3rem]"></div>
                  
                  <div className="absolute top-10 left-10 flex flex-col gap-2">
                     <span className="bg-slate-900/60 backdrop-blur px-3 py-1 rounded text-[9px] text-emerald-400 font-black tracking-widest uppercase">Anatomy Detected</span>
                     <span className="bg-slate-900/60 backdrop-blur px-3 py-1 rounded text-[9px] text-blue-400 font-black tracking-widest uppercase">Focus: Medications</span>
                  </div>
               </div>
            </div>
            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12 px-12">
              <button onClick={() => { stopCamera(); setMode('idle'); }} className="w-16 h-16 bg-white/10 backdrop-blur-xl text-white rounded-full text-2xl">✕</button>
              <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full border-[10px] border-blue-600 shadow-2xl active:scale-90 transition-all flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full"></div>
              </button>
              <div className="w-16 h-16"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-12 bg-white">
            <div className="text-center mb-8">
               <h4 className="text-4xl font-black text-slate-900 tracking-tighter">Confirm Capture</h4>
               <p className="text-slate-400 font-bold mt-1">Ensure the medication list is readable.</p>
            </div>
            <div className="flex-1 relative rounded-[3rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-50">
              <img src={previewUrl} className="w-full h-full object-contain" alt="Prescription" />
            </div>
            <div className="mt-10 flex gap-6">
               <button onClick={() => setMode('idle')} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black hover:bg-slate-200 transition-all">Retake</button>
               <button onClick={() => onUpload(previewUrl)} className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Analyze Patterns</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionUpload;
