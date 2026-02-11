
import React, { useState, useRef, useEffect } from 'react';

interface PrescriptionUploadProps {
  onUpload: (file: File | string) => void;
  isProcessing: boolean;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onUpload, isProcessing }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [hudScale, setHudScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stages = [
    "Locking Clinical Region...",
    "Extracting Ink Patterns...",
    "Resolving Doctor's Sig...",
    "Cross-referencing Pharma DB...",
    "Optimizing Regimen Timings..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (mode === 'camera') {
      const interval = setInterval(() => {
        setHudScale(0.98 + Math.random() * 0.04);
      }, 150);
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
      alert("Camera access required for high-accuracy clinical scanning.");
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
      reader.onload = (ev) => { 
        setPreviewUrl(ev.target?.result as string); 
        setMode('preview'); 
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-3xl overflow-hidden min-h-[680px] flex flex-col relative group">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-slate-900/98 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
             <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="w-full h-[15px] bg-blue-500 shadow-[0_0_60px_#3b82f6] absolute top-0 animate-scan-line-rapid"></div>
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-10">
                  {[...Array(144)].map((_, i) => (
                    <div key={i} className="border-[0.25px] border-blue-400"></div>
                  ))}
                </div>
             </div>

             <div className="relative mb-16 scale-125">
                <div className="w-40 h-40 border-[12px] border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 w-40 h-40 border-[12px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-7xl animate-pulse">💊</div>
             </div>
             
             <h3 className="text-4xl font-black text-white tracking-tighter mb-4 italic">Neural Adherence Scan</h3>
             <div className="w-full max-w-sm space-y-6">
                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1 shadow-inner">
                   <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 ease-out rounded-full shadow-[0_0_20px_#3b82f6]" style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}></div>
                </div>
                <p className="text-cyan-400 text-xl font-black tracking-tight h-8 animate-pulse">
                   {stages[loadingStage]}
                </p>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-10 bg-white">
            <div className="text-center">
               <div className="inline-block px-5 py-2 bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-[0.4em] rounded-full mb-8 border border-blue-100">Intelligent Extraction v4.0</div>
               <h3 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Literal<br/><span className="text-blue-600">Scan.</span></h3>
               <p className="text-slate-400 font-bold text-lg max-w-sm mx-auto leading-relaxed">Turn messy handwriting into a perfect medication timeline.</p>
            </div>

            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3.5rem] flex flex-col items-center justify-center space-y-8 hover:bg-blue-700 transition-all shadow-3xl active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
              <div className="text-[10rem] group-hover:scale-110 transition-transform duration-500 relative z-10 drop-shadow-2xl">📸</div>
              <div className="text-center relative z-10">
                <span className="block text-4xl font-black tracking-tighter">Start Adherence Scan</span>
                <span className="text-[11px] opacity-70 font-black uppercase tracking-[0.6em] mt-4 block">Ultra-High Resolution Vision</span>
              </div>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-10 bg-slate-50 text-slate-700 rounded-[3rem] font-black text-2xl border-4 border-slate-100 hover:border-blue-300 hover:bg-white transition-all flex items-center justify-center gap-6 shadow-sm group"
            >
              <span className="group-hover:scale-125 transition-transform">📂</span> Choose from Gallery
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
            
            {/* HUD OVERLAY */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-16">
               <div 
                 className="w-full h-full border-4 border-white/20 rounded-[4rem] relative transition-transform duration-150"
                 style={{ transform: `scale(${hudScale})` }}
               >
                  {/* CORNERS */}
                  <div className="absolute top-0 left-0 w-28 h-28 border-t-8 border-l-8 border-blue-500 rounded-tl-[4rem] shadow-[0_0_20px_#3b82f6]"></div>
                  <div className="absolute top-0 right-0 w-28 h-28 border-t-8 border-r-8 border-blue-500 rounded-tr-[4rem] shadow-[0_0_20px_#3b82f6]"></div>
                  <div className="absolute bottom-0 left-0 w-28 h-28 border-b-8 border-l-8 border-blue-500 rounded-bl-[4rem] shadow-[0_0_20px_#3b82f6]"></div>
                  <div className="absolute bottom-0 right-0 w-28 h-28 border-b-8 border-r-8 border-blue-500 rounded-br-[4rem] shadow-[0_0_20px_#3b82f6]"></div>
                  
                  {/* RETICULE */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/2 h-[2px] bg-white/20 animate-pulse"></div>
                    <div className="absolute w-[2px] h-1/2 bg-white/20 animate-pulse"></div>
                  </div>

                  {/* DETECTION HUD ELEMENTS */}
                  <div className="absolute top-20 left-10 space-y-2">
                     <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] text-white font-black uppercase tracking-widest">Header Detected</span>
                     </div>
                     <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] text-white font-black uppercase tracking-widest">Medication Area</span>
                     </div>
                  </div>

                  <div className="absolute bottom-20 right-10 flex flex-col items-end gap-2">
                     <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Neural Logic v4.2</span>
                     <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">4K Adherence Mapping</span>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-16 left-0 right-0 flex justify-center items-center gap-16">
              <button onClick={() => { stopCamera(); setMode('idle'); }} className="w-20 h-20 bg-white/10 backdrop-blur-3xl text-white rounded-full text-3xl border border-white/20 shadow-2xl">✕</button>
              <button onClick={capturePhoto} className="w-28 h-28 bg-white rounded-full border-[12px] border-blue-600 shadow-[0_0_60px_#3b82f6] active:scale-90 transition-all flex items-center justify-center relative group">
                <div className="w-20 h-20 bg-blue-600 rounded-full transition-transform group-hover:scale-90"></div>
                <div className="absolute -inset-4 border-2 border-white/30 rounded-full animate-ping"></div>
              </button>
              <div className="w-20 h-20"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-12 bg-white">
            <div className="text-center mb-10">
               <h4 className="text-5xl font-black text-slate-900 tracking-tighter">Confirm Capture</h4>
               <p className="text-slate-400 font-bold text-lg mt-2 italic">Ensure text is clear for Forensic OCR extraction.</p>
            </div>
            <div className="flex-1 relative rounded-[4rem] overflow-hidden border-8 border-slate-50 shadow-2xl bg-slate-50">
              <img src={previewUrl} className="w-full h-full object-contain" alt="Prescription" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-8 left-0 right-0 text-center">
                 <span className="bg-blue-600/90 backdrop-blur text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em]">Ready for Timeline Extraction</span>
              </div>
            </div>
            <div className="mt-12 flex gap-8">
               <button onClick={() => setMode('idle')} className="flex-1 py-8 bg-slate-100 text-slate-500 rounded-[3rem] font-black text-2xl hover:bg-slate-200 transition-all">Retake</button>
               <button onClick={() => onUpload(previewUrl)} className="flex-[2] py-8 bg-blue-600 text-white rounded-[3rem] font-black text-2xl shadow-[0_20px_40px_rgba(37,99,235,0.4)] hover:bg-blue-700 active:scale-95 transition-all">Analyze Forensic Data</button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line-rapid {
          0% { top: -2%; }
          100% { top: 102%; }
        }
        .animate-scan-line-rapid {
          animation: scan-line-rapid 1.2s infinite linear;
        }
      `}} />
    </div>
  );
};

export default PrescriptionUpload;
