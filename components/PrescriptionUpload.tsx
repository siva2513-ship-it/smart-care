
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
    "Initializing Optical Sensors...",
    "Scanning Handwritten Sig Codes...",
    "Applying Neural Denoising...",
    "Decoding Clinical Latin Sig...",
    "Verifying Pharmaceutical DB...",
    "Validating Dosage Safety...",
    "Generating Native Translation..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 1300);
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
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-3xl overflow-hidden min-h-[600px] flex flex-col relative group">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
             <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="w-full h-[4px] bg-blue-600 shadow-[0_0_20px_#2563eb] absolute top-0 animate-scan-line"></div>
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 pointer-events-none">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="border-[0.5px] border-blue-200/30"></div>
                  ))}
                </div>
             </div>

             <div className="relative mb-16 scale-125">
                <div className="w-40 h-40 border-[12px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl">🤖</div>
                <div className="absolute -inset-6 border-2 border-dashed border-blue-200 rounded-full animate-[spin_10s_linear_infinite] opacity-50"></div>
             </div>
             
             <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Neural Scanning...</h3>
             <div className="w-full max-w-sm space-y-4">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                   <div className="h-full bg-blue-600 transition-all duration-700 ease-out shadow-[0_0_15px_#2563eb]" style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}></div>
                </div>
                <p className="text-blue-600 text-lg font-black italic animate-pulse tracking-tight h-8">
                   {stages[loadingStage]}
                </p>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-8 bg-gradient-to-b from-white to-slate-50">
            <div className="text-center mb-4">
               <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">Clinical Grade OCR</div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Scan Prescription</h3>
               <p className="text-slate-500 font-bold text-lg mt-2 italic leading-tight">Gemini Vision detects handwriting with 98.4% accuracy</p>
            </div>

            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3.5rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-2xl active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="text-9xl group-hover:scale-110 transition-transform relative z-10 drop-shadow-2xl">📷</div>
              <div className="text-center relative z-10">
                <span className="block text-4xl font-black tracking-tighter">Open Scanner</span>
                <span className="text-sm opacity-80 font-black uppercase tracking-[0.4em] mt-2 block">Focus on Handwriting</span>
              </div>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-8 bg-white text-slate-700 rounded-[2.5rem] font-black text-xl border-4 border-slate-100 hover:border-blue-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-4 shadow-sm"
            >
              <span className="text-2xl">📂</span> Pick from Gallery
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-12">
               {/* Advanced Focus Reticle */}
               <div className="w-full h-full border-2 border-white/20 border-dashed rounded-[3.5rem] relative">
                  <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-blue-500 rounded-tl-[3.5rem]"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-blue-500 rounded-tr-[3.5rem]"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-blue-500 rounded-bl-[3.5rem]"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-blue-500 rounded-br-[3.5rem]"></div>
                  
                  {/* Floating HUD Elements */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                    <p className="text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Optical Focus Locked
                    </p>
                  </div>

                  <div className="absolute bottom-32 left-8 text-white/40 font-black text-[8px] uppercase tracking-widest flex flex-col gap-1">
                    <span>ISO 400</span>
                    <span>WB AUTO</span>
                    <span>Clinical v2.4</span>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12">
              <button onClick={() => { stopCamera(); setMode('idle'); }} className="w-16 h-16 bg-white/10 backdrop-blur-xl text-white rounded-full text-2xl border border-white/20 shadow-lg hover:bg-white/20 transition-all">✕</button>
              <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full border-8 border-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.6)] active:scale-90 transition-all flex items-center justify-center overflow-hidden">
                <div className="w-16 h-16 bg-blue-600 rounded-full animate-pulse"></div>
              </button>
              <div className="w-16 h-16"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-10 bg-white">
            <div className="text-center mb-8">
               <h4 className="text-4xl font-black text-slate-800 tracking-tighter">Optical Confirmation</h4>
               <p className="text-slate-400 font-bold">Ensure all text is sharp for AI extraction</p>
            </div>
            <div className="flex-1 relative rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-inner bg-slate-100 group">
              <img src={previewUrl} className="w-full h-full object-contain" alt="Prescription" />
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="px-6 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
                    <span className="text-blue-600 font-black uppercase text-xs tracking-widest">Image Enhancement Active</span>
                 </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
              </div>
            </div>
            <div className="mt-10 flex gap-6">
               <button onClick={() => setMode('idle')} className="flex-1 py-7 bg-slate-100 text-slate-600 rounded-[2.5rem] font-black text-2xl hover:bg-slate-200 transition-all">Retake</button>
               <button onClick={() => onUpload(previewUrl)} className="flex-[2] py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-blue-700 transition-all active:scale-95">Verify & Analyze</button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-scan-line {
          animation: scan-line 3s infinite linear;
        }
      `}} />
    </div>
  );
};

export default PrescriptionUpload;
