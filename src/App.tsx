
import React, { useState, useCallback, useMemo } from 'react';
import { transformImage } from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Loader } from './components/Loader';
import { UploadIcon, SparklesIcon, ArrowPathIcon, CameraIcon, ScissorsIcon, ArrowDownTrayIcon } from './components/icons';

type AppState = 'idle' | 'loading' | 'displaying' | 'error';
export type TransformStyle = 'lofi' | 'cutout';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimePart, base64Part] = result.split(',');
      if (!mimePart || !base64Part) {
        reject(new Error('Invalid file format'));
        return;
      }
      const mimeType = mimePart.split(':')[1].split(';')[0];
      resolve({ base64: base64Part, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string } | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<TransformStyle>('lofi');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage({ file, url: URL.createObjectURL(file) });
      setTransformedImage(null);
      setAppState('idle');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleTransform = useCallback(async () => {
    if (!originalImage) return;

    setAppState('loading');
    setErrorMessage('');

    try {
      const { base64, mimeType } = await fileToBase64(originalImage.file);
      const transformedBase64 = await transformImage(base64, mimeType, selectedStyle);
      
      if (!transformedBase64) {
          throw new Error("The AI couldn't transform the image. Please try another one.");
      }

      setTransformedImage(`data:image/png;base64,${transformedBase64}`);
      setAppState('displaying');
    } catch (error) {
      console.error('Transformation failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setAppState('error');
    }
  }, [originalImage, selectedStyle]);

  const handleReset = () => {
    setOriginalImage(null);
    setTransformedImage(null);
    setAppState('idle');
    setErrorMessage('');
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const MemoizedHeader = React.memo(Header);
  const MemoizedFooter = React.memo(Footer);
  
  const styleTitle = useMemo(() => {
    if (selectedStyle === 'lofi') return '2000s Lofi';
    if (selectedStyle === 'cutout') return 'Paper Cutout';
    return 'Early 2000s';
  }, [selectedStyle]);

  return (
    <div className="min-h-screen text-white flex flex-col p-4 sm:p-6 lg:p-8">
      <MemoizedHeader />
      <main className="flex-grow flex flex-col items-center justify-center container mx-auto text-center">
        {appState === 'loading' ? (
          <Loader />
        ) : (
          <div className="w-full max-w-5xl">
            {!originalImage ? (
                <UploadSplash onUploadClick={triggerFileSelect} />
            ) : appState === 'displaying' && transformedImage ? (
                <ResultDisplay
                    originalUrl={originalImage.url}
                    transformedUrl={transformedImage}
                    onReset={handleReset}
                    styleTitle={styleTitle}
                />
            ) : (
                <PreviewAndTransform
                    imageUrl={originalImage.url}
                    onTransform={handleTransform}
                    onReset={triggerFileSelect}
                    isError={appState === 'error'}
                    errorMessage={errorMessage}
                    selectedStyle={selectedStyle}
                    onStyleChange={setSelectedStyle}
                />
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
          </div>
        )}
      </main>
      <MemoizedFooter />
    </div>
  );
};

// Sub-components
const UploadSplash: React.FC<{onUploadClick: () => void}> = ({onUploadClick}) => (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-pink-500/50 rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg shadow-pink-500/10">
        <UploadIcon className="w-16 h-16 mb-4 text-pink-400" />
        <h2 className="text-2xl font-bold font-orbitron mb-2">Upload Your Photo</h2>
        <p className="text-gray-400 mb-6 max-w-md">Select an image to begin the transformation into a 2000s nightlife throwback.</p>
        <button
            onClick={onUploadClick}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30"
        >
            Select Image
        </button>
    </div>
);

interface PreviewProps {
    imageUrl: string;
    onTransform: () => void;
    onReset: () => void;
    isError: boolean;
    errorMessage: string;
    selectedStyle: TransformStyle;
    onStyleChange: (style: TransformStyle) => void;
}

const PreviewAndTransform: React.FC<PreviewProps> = ({ imageUrl, onTransform, onReset, isError, errorMessage, selectedStyle, onStyleChange }) => (
    <div className="flex flex-col items-center gap-8">
        <div className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl shadow-purple-500/20">
            <img src={imageUrl} alt="Preview" className="w-full h-auto object-cover"/>
            <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        <div className="w-full max-w-2xl">
            <h3 className="text-xl font-bold font-orbitron mb-4">Choose a Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StyleButton
                    icon={<CameraIcon />}
                    title="2000s Lofi"
                    description="Authentic digital camera look with a date stamp."
                    isSelected={selectedStyle === 'lofi'}
                    onClick={() => onStyleChange('lofi')}
                />
                <StyleButton
                    icon={<ScissorsIcon />}
                    title="Paper Cutout"
                    description="A fun scrapbook style with 2000s themed objects."
                    isSelected={selectedStyle === 'cutout'}
                    onClick={() => onStyleChange('cutout')}
                />
            </div>
        </div>

        {isError && (
             <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
                <p className="font-bold">Transformation Failed</p>
                <p className="text-sm">{errorMessage}</p>
            </div>
        )}
        <div className="flex items-center gap-4 mt-4">
            <button onClick={onReset} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-300">
                Change Photo
            </button>
            <button
                onClick={onTransform}
                className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
                <SparklesIcon className="w-5 h-5" />
                Transform
            </button>
        </div>
    </div>
);

interface StyleButtonProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
}

const StyleButton: React.FC<StyleButtonProps> = ({ icon, title, description, isSelected, onClick }) => {
    const baseClasses = "p-4 rounded-lg text-left transition-all duration-300 cursor-pointer border-2 flex items-center gap-4";
    const selectedClasses = "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20";
    const unselectedClasses = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";

    return (
        <div onClick={onClick} className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}>
            <div className="w-8 h-8 flex-shrink-0 text-teal-400">{icon}</div>
            <div>
                <h4 className="font-bold text-white">{title}</h4>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    );
};

const ResultDisplay: React.FC<{originalUrl: string; transformedUrl: string; onReset: () => void; styleTitle: string}> = ({ originalUrl, transformedUrl, onReset, styleTitle }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = transformedUrl;
        const fileName = `2000s-flashback-${styleTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                <ImageCard title="Original" imageUrl={originalUrl} />
                <ImageCard title={styleTitle} imageUrl={transformedUrl} isTransformed />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button onClick={onReset} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-300 flex items-center gap-2 w-full sm:w-auto justify-center">
                    <ArrowPathIcon className="w-5 h-5"/>
                    Start Over
                </button>
                <button 
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <ArrowDownTrayIcon className="w-5 h-5"/>
                    Download Image
                </button>
            </div>
        </div>
    );
};


const ImageCard: React.FC<{title: string; imageUrl: string; isTransformed?: boolean}> = ({title, imageUrl, isTransformed = false}) => {
    const titleClasses = useMemo(() => 
        isTransformed
        ? "font-orbitron text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500"
        : "font-orbitron text-2xl font-bold text-gray-400", 
    [isTransformed]);
    
    return (
        <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <h3 className={titleClasses}>{title}</h3>
            <div className="mt-4 aspect-square rounded-lg overflow-hidden">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
        </div>
    );
};


export default App;