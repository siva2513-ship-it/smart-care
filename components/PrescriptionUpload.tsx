
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
    "Scanning handwriting...",
    "Decoding medical terms...",
    "Verifying with clinical database...",
    "Checking drug interactions...",
    "Finalizing care plan..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please allow camera access or upload a saved photo.");
      setMode('idle');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(dataUrl);
      setMode('preview');
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = () => {
    if (previewUrl) {
      onUpload(previewUrl);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-2xl overflow-hidden min-h-[550px] flex flex-col relative transition-all duration-500">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
             <div className="relative mb-12">
                <div className="w-36 h-36 border-[14px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🧠</div>
             </div>
             <h3 className="text-5xl font-black text-slate-900 tracking-tight">Clinical Analysis</h3>
             <div className="mt-8 space-y-4 w-full max-w-sm">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}></div>
                </div>
                <p className="text-blue-600 text-2xl font-black italic animate-pulse">
                   {stages[loadingStage]}
                </p>
             </div>
             <p className="text-slate-400 text-lg font-bold mt-8">
               Our AI is verifying handwriting against medical safety protocols.
             </p>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-8">
            <div className="text-center mb-4">
               <h3 className="text-4xl font-black text-slate-900">Upload Prescription</h3>
               <p className="text-slate-500 font-bold text-xl">Clear photos give better answers.</p>
            </div>

            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-2xl active:scale-95 group"
            >
              <div className="text-8xl group-hover:scale-110 transition-transform">📸</div>
              <div className="text-center">
                <span className="block text-4xl font-black">Scan Document</span>
                <span className="text-xl opacity-80 font-bold">Best for messy handwriting</span>
              </div>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-8 bg-slate-50 text-slate-700 rounded-[2.5rem] font-black text-2xl border-4 border-slate-100 hover:border-blue-300 transition-all active:scale-95 flex items-center justify-center gap-6"
            >
              <span>🖼️</span> Pick from Gallery
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="w-[85%] h-[65%] border-4 border-white/40 border-dashed rounded-[3rem] relative shadow-[0_0_0_1000px_rgba(0,0,0,0.4)]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="bg-blue-600/20 px-6 py-2 rounded-full border border-blue-400/50">
                       <p className="text-white font-black text-xl uppercase tracking-widest text-center">
                         Center Text Here
                       </p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12 px-10">
              <button 
                onClick={() => { stopCamera(); setMode('idle'); }} 
                className="w-20 h-20 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center text-3xl shadow-2xl active:scale-90"
              >
                ✕
              </button>
              <button 
                onClick={capturePhoto} 
                className="w-32 h-32 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-all flex items-center justify-center"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-full"></div>
              </button>
              <div className="w-20 h-20"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-10 bg-white">
            <div className="text-center mb-8">
               <h4 className="text-4xl font-black text-slate-800">Review Image</h4>
               <p className="text-slate-400 font-bold text-xl">Is the handwriting readable?</p>
            </div>
            
            <div className="flex-1 relative rounded-[3rem] overflow-hidden border-4 border-slate-100 shadow-inner">
              <img src={previewUrl} className="w-full h-full object-contain bg-slate-50" />
            </div>

            <div className="mt-10 flex gap-6">
               <button 
                 onClick={() => setMode('idle')} 
                 className="flex-1 py-7 bg-slate-100 text-slate-600 rounded-[2.5rem] font-black text-2xl hover:bg-slate-200 transition-all"
               >
                 Retake
               </button>
               <button 
                 onClick={handleFinalSubmit}
                 className="flex-[2] py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-3xl shadow-xl hover:bg-blue-700 transition-all"
               >
                 Verify Scan
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 p-8 bg-blue-600 rounded-[3rem] text-white shadow-xl flex items-center gap-8">
         <div className="text-5xl">💡</div>
         <div>
            <h4 className="text-2xl font-black mb-1">Scanning Tip</h4>
            <p className="text-blue-100 font-bold text-lg leading-tight">
               Hold your phone steady and ensure there are no shadows on the paper for 100% accurate results.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;
