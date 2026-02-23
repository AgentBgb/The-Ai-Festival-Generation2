/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Sparkles, Image as ImageIcon, Loader2, Download, RefreshCw, Share2, Twitter, Facebook, Moon, Sun } from 'lucide-react';
import { cn } from './lib/utils';

interface Festival {
  id: string;
  name: string;
  prompt: string;
  color: string;
  icon: string;
  description: string;
}

const FESTIVALS: Festival[] = [
  {
    id: 'holi',
    name: 'Holi',
    color: '#FF6321',
    icon: '🎨',
    description: 'Festival of Colors',
    prompt: `Create a realistic Holi festival portrait using the uploaded image as the base. Add vibrant colorful powder (gulal) flying in the air around me in shades of bright pink, yellow, blue, green, and orange. Add natural-looking color powder on my cheeks, forehead, and chin, softly blended into the skin for realism. Keep my facial features clear and sharp. Add dynamic color splashes in mid-air with fine powder particles visible, creating a festive explosion effect. Use natural sunlight with warm golden tones. Add slight cinematic lighting and shallow depth of field. Background should look like an outdoor Holi celebration with soft blur, colorful crowd, and festive atmosphere. Make the colors look vivid, high saturation but realistic. Ultra HD, high detail, sharp focus, 4K resolution, professional photography, vibrant, joyful mood, candid expression, natural skin texture preserved.`
  },
  {
    id: 'diwali',
    name: 'Diwali',
    color: '#FFD700',
    icon: '🪔',
    description: 'Festival of Lights',
    prompt: `Create a realistic Diwali festival portrait. Add warm, glowing traditional clay lamps (diyas) in the foreground and background. Add beautiful, vibrant fireworks bursting in the night sky behind me. I should be wearing elegant traditional Indian festive attire. The lighting should be warm and golden, reflecting the glow of the diyas on my face and skin. Keep facial features sharp and clear. Background should be a festive night scene with fairy lights and a joyful atmosphere. High detail, cinematic lighting, 4K resolution, professional photography, warm and celebratory mood.`
  },
  {
    id: 'christmas',
    name: 'Christmas',
    color: '#D42426',
    icon: '🎄',
    description: 'Winter Holiday',
    prompt: `Create a realistic Christmas holiday portrait. Add a soft, snowy winter background with a beautifully decorated Christmas tree with twinkling lights. I should be wearing a cozy winter sweater or a festive Santa hat. Add a warm, soft glow from holiday lights. The atmosphere should be cozy and magical with gentle snowflakes falling. Keep facial features sharp and clear. Cinematic lighting, shallow depth of field, high detail, 4K resolution, professional photography, joyful and warm holiday mood.`
  },
  {
    id: 'eid',
    name: 'Eid',
    color: '#1B4D3E',
    icon: '🌙',
    description: 'Eid al-Fitr / al-Adha',
    prompt: `Create a realistic Eid festival portrait. Add elegant crescent moon and star motifs in the background. Include beautiful traditional lanterns (fanous) with warm glowing light. I should be wearing elegant traditional festive attire. The lighting should be soft and sophisticated, with a warm festive glow. Keep facial features sharp and clear. Background should be a serene and celebratory evening scene. High detail, cinematic lighting, 4K resolution, professional photography, peaceful and joyful mood.`
  },
  {
    id: 'halloween',
    name: 'Halloween',
    color: '#F97316',
    icon: '🎃',
    description: 'Spooky Season',
    prompt: `Create a realistic Halloween portrait. Add a spooky but fun atmosphere with carved glowing pumpkins (jack-o'-lanterns) and subtle wisps of fog. The lighting should be dramatic and moody with orange and purple highlights. I should be wearing subtle costume elements or festive Halloween accessories. Keep facial features sharp and clear. Background should be a mysterious night scene with a full moon. High detail, cinematic lighting, 4K resolution, professional photography, spooky and playful mood.`
  },
  {
    id: 'cny',
    name: 'Lunar New Year',
    color: '#EE2124',
    icon: '🧧',
    description: 'Chinese New Year',
    prompt: `Create a realistic Lunar New Year portrait. Add vibrant red lanterns and traditional gold decorations in the background. Include subtle dragon or lion dance motifs. I should be wearing traditional red festive clothing. The lighting should be bright and celebratory with warm red and gold tones. Keep facial features sharp and clear. Background should be a festive street or home scene with fireworks. High detail, cinematic lighting, 4K resolution, professional photography, prosperous and joyful mood.`
  },
  {
    id: 'carnival',
    name: 'Rio Carnival',
    color: '#A855F7',
    icon: '🎭',
    description: 'Carnival Celebration',
    prompt: `Create a realistic Rio Carnival portrait. Add vibrant, colorful feathers, sequins, and glitter around me. I should be wearing a spectacular carnival headpiece or festive accessories. The lighting should be energetic and dynamic with multi-colored spotlights. Keep facial features sharp and clear. Background should be a blurred, high-energy parade scene with a colorful crowd and festive energy. High detail, cinematic lighting, 4K resolution, professional photography, vibrant and ecstatic mood.`
  }
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival>(FESTIVALS[0]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] } as any,
    multiple: false
  } as any);

  const generateFestivalImage = async () => {
    if (!image) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data and mime type
      const base64Data = image.split(',')[1];
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: selectedFestival.prompt,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setResultImage(`data:image/png;base64,${base64EncodeString}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated by the model. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate image. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `${selectedFestival.id}-portrait.png`;
    link.click();
  };

  const shareOnTwitter = () => {
    const text = `Check out my ${selectedFestival.name} portrait generated with AI! 🎨✨`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const reset = () => {
    setImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans selection:bg-[#FF6321]/30",
      isDarkMode ? "bg-[#121212] text-zinc-100" : "bg-[#f5f2ed] text-[#1a1a1a]"
    )}>
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10 px-6 py-4 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#FF6321] to-[#FFD700] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Festival AI Portrait</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          {image && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Upload & Controls */}
          <section className="space-y-8">
            <div className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-serif font-light leading-tight"
              >
                Transform your photos into <span className="italic text-[#FF6321]">festive masterpieces</span>.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-black/60 dark:text-white/60 max-w-md"
              >
                Upload a portrait and choose a festival to celebrate with AI.
              </motion.p>
            </div>

            {/* Festival Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-black/40 dark:text-white/40">Select Festival</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FESTIVALS.map((fest) => (
                  <button
                    key={fest.id}
                    onClick={() => {
                      setSelectedFestival(fest);
                      setResultImage(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center",
                      selectedFestival.id === fest.id 
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105" 
                        : "border-black/5 dark:border-white/10 bg-white dark:bg-zinc-800/50 hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.02] dark:hover:bg-zinc-800"
                    )}
                  >
                    <span className="text-2xl">{fest.icon}</span>
                    <span className="text-xs font-bold">{fest.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {!image ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                    isDragActive 
                      ? "border-[#FF6321] bg-[#FF6321]/5" 
                      : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-black/40 dark:text-white/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium">Drop your photo here</p>
                    <p className="text-sm text-black/40 dark:text-white/40">or click to browse from your device</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-900 p-2"
                >
                  <img 
                    src={image} 
                    alt="Original" 
                    className="w-full aspect-[4/5] object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setImage(null)}
                      className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </motion.div>
              )}

              {image && !resultImage && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={generateFestivalImage}
                  disabled={isGenerating}
                  style={{ backgroundColor: isGenerating ? undefined : selectedFestival.color }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-xl text-white",
                    isGenerating 
                      ? "bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed" 
                      : "hover:brightness-110 active:scale-[0.98]"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate {selectedFestival.name} Portrait
                    </>
                  )}
                </motion.button>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </section>

          {/* Right Column: Result */}
          <section className="relative min-h-[600px] flex flex-col">
            <div className="flex-1 rounded-[2rem] border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <span className="text-sm font-medium uppercase tracking-wider text-black/40 dark:text-white/40">Result</span>
                </div>
                {resultImage && (
                  <button 
                    onClick={downloadImage}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    title="Download Image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex-1 relative bg-[#fafafa] dark:bg-black/20 flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                  {resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full h-full flex flex-col gap-6"
                    >
                      <img 
                        src={resultImage} 
                        alt={`Generated ${selectedFestival.name} Portrait`} 
                        className="w-full flex-1 object-contain rounded-xl shadow-lg"
                      />
                      
                      {/* Action Buttons Below Image */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                          onClick={downloadImage}
                          className="flex items-center justify-center gap-2 py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-all shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button 
                          onClick={shareOnTwitter}
                          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1DA1F2] text-white rounded-xl font-medium hover:bg-[#1DA1F2]/80 transition-all shadow-lg"
                        >
                          <Twitter className="w-4 h-4" />
                          Twitter
                        </button>
                        <button 
                          onClick={shareOnFacebook}
                          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#4267B2] text-white rounded-xl font-medium hover:bg-[#4267B2]/80 transition-all shadow-lg"
                        >
                          <Facebook className="w-4 h-4" />
                          Facebook
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button 
                          onClick={() => setResultImage(null)}
                          className="text-sm font-medium text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Try another festival
                        </button>
                      </div>
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-6 text-center"
                    >
                      <div className="relative">
                        <div 
                          className="w-24 h-24 border-4 rounded-full animate-spin" 
                          style={{ borderColor: `${selectedFestival.color}20`, borderTopColor: selectedFestival.color }}
                        />
                        <Sparkles className="absolute inset-0 m-auto w-8 h-8 animate-pulse" style={{ color: selectedFestival.color }} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-serif italic">Creating your {selectedFestival.name} portrait...</p>
                        <p className="text-sm text-black/40 dark:text-white/40 max-w-[200px]">Our AI is carefully applying festive elements to your photo.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-black/[0.02] dark:bg-white/[0.02] rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="w-8 h-8 text-black/10 dark:text-white/10" />
                      </div>
                      <p className="text-black/30 dark:text-white/30 font-medium">Your generated portrait will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl -z-10" style={{ backgroundColor: `${selectedFestival.color}10` }} />
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full blur-3xl -z-10" style={{ backgroundColor: `${selectedFestival.color}05` }} />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-black/5 dark:border-white/5 py-12 px-6 text-center">
        <p className="text-sm text-black/40 dark:text-white/40">
          Powered by Gemini 2.5 Flash Image • Celebrate the World's Festivals
        </p>
      </footer>
    </div>
  );
}
