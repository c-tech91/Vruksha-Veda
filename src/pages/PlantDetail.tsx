import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Leaf, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  ImageIcon,
  BookOpen,
  Sprout,
  FlaskConical,
  Volume2,
  Pause
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type Plant = {
  id: string;
  name: string;
  botanical_name?: string;
  family?: string;
  synonyms: string[];
  english_name?: string;
  useful_parts: string[];
  indications: string[];
  shloka?: string;
  source_document?: string;
  images: string[];
  created_at: string;
  updated_at?: string;
};

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (id) {
      loadPlant(id);
    }

    // Create audio element for TTS playback
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }

    // Cleanup: stop any ongoing audio when component unmounts
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    };
  }, [id]);

  // Stop audio playback function
  const stopAudio = () => {
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // Also stop any HTML audio element if exists
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.src = '';
    }
    
    setIsPlaying(false);
  };

  const loadPlant = async (plantId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("plants")
        .select("*")
        .eq("id", plantId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("Plant not found");
        } else {
          throw fetchError;
        }
        return;
      }

      if (!data) {
        setError("Plant not found");
        return;
      }

      // Debug: Log the plant data to see what's being loaded
      console.log("Plant data loaded:", data);
      console.log("Shloka field:", data.shloka);
      console.log("Shloka type:", typeof data.shloka);
      console.log("Shloka length:", data.shloka?.length);

      setPlant(data);
    } catch (err) {
      console.error("Error loading plant:", err);
      setError("Failed to load plant details. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load plant details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-teal-300 border-t-transparent animate-spin animation-delay-200" />
              <Leaf className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-gentle-float" />
            </div>
            <p className="text-gray-600 text-lg font-semibold">Loading plant details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-24 px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Plant Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "The plant you're looking for doesn't exist."}</p>
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => navigate("/plants")}
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plants
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words hyphens-auto">
                    {plant.name}
                  </h1>
                  {plant.botanical_name && (
                    <p className="text-lg sm:text-xl text-emerald-100 italic mb-2 break-words hyphens-auto">
                      {plant.botanical_name}
                    </p>
                  )}
                  {plant.english_name && (
                    <p className="text-base sm:text-lg text-emerald-100 break-words">
                      {plant.english_name}
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Images Section */}
              {plant.images && plant.images.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-emerald-600" />
                      Images
                    </h2>
                  </div>
                  
                  {/* Main Image */}
                  <div className="mb-4">
                    <img
                      src={plant.images[selectedImageIndex]}
                      alt={plant.name}
                      className="w-full h-96 object-cover rounded-2xl shadow-lg"
                    />
                  </div>

                  {/* Thumbnail Gallery */}
                  {plant.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {plant.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index
                              ? "border-emerald-500 ring-2 ring-emerald-200"
                              : "border-gray-200 hover:border-emerald-300"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${plant.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Botanical Information */}
                  <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-emerald-600" />
                      Botanical Information
                    </h2>
                    <dl className="space-y-3">
                      {plant.family && (
                        <div>
                          <dt className="text-sm font-semibold text-gray-600">Family</dt>
                          <dd className="text-gray-900 break-words">{plant.family}</dd>
                        </div>
                      )}
                      {plant.synonyms && plant.synonyms.length > 0 && (
                        <div>
                          <dt className="text-sm font-semibold text-gray-600">Synonyms</dt>
                          <dd className="text-gray-900 break-words">{plant.synonyms.join(", ")}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Useful Parts */}
                  {plant.useful_parts && plant.useful_parts.length > 0 && (
                    <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-teal-600" />
                        Useful Parts
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {plant.useful_parts.map((part, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Indications */}
                  {plant.indications && plant.indications.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        Indications
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {plant.indications.map((indication, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                          >
                            {indication}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Sanskrit Shloka */}
              {plant.shloka !== null && 
               plant.shloka !== undefined && 
               String(plant.shloka).trim() !== '' && (
                <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Sanskrit Shloka
                  </h2>
                  <div className="bg-white/50 p-6 rounded-lg mb-4">
                    <p className="text-gray-800 text-lg font-serif leading-relaxed whitespace-pre-wrap text-center break-words">
                      {String(plant.shloka)}
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    {isPlaying ? (
                      <Button
                        onClick={() => {
                          stopAudio();
                        }}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                      >
                        <Pause className="mr-2 w-5 h-5" />
                        Stop Audio
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          try {
                            const textToSpeak = (plant.shloka || '').trim();
                            
                            if (!textToSpeak || textToSpeak.length === 0) {
                              toast({
                                title: "Error",
                                description: "No text available to play",
                                variant: "destructive",
                              });
                              return;
                            }

                            // Stop any existing audio first
                            stopAudio();

                            // Use Web Speech API (native, works on all platforms including mobile)
                            if (!('speechSynthesis' in window)) {
                              toast({
                                title: "Not Supported",
                                description: "Text-to-speech is not supported on this device.",
                                variant: "destructive",
                              });
                              return;
                            }

                            // Cancel any ongoing speech
                            speechSynthesis.cancel();
                            
                            // Wait a bit to ensure cancellation
                            await new Promise(resolve => setTimeout(resolve, 200));
                            
                            // Create utterance
                            const utterance = new SpeechSynthesisUtterance(textToSpeak);
                            
                            // Try to find a Hindi voice for Sanskrit
                            const voices = speechSynthesis.getVoices();
                            let selectedVoice = voices.find(voice => 
                              voice.lang === 'hi-IN' || 
                              voice.lang === 'hi' ||
                              voice.lang.startsWith('hi-')
                            );
                            
                            // If no Hindi voice, try any Indian English
                            if (!selectedVoice) {
                              selectedVoice = voices.find(voice => 
                                voice.lang === 'en-IN' ||
                                voice.lang.includes('IN')
                              );
                            }
                            
                            // If still no voice, use any available
                            if (!selectedVoice && voices.length > 0) {
                              selectedVoice = voices[0];
                            }
                            
                            // Set voice and language
                            if (selectedVoice) {
                              utterance.voice = selectedVoice;
                              utterance.lang = selectedVoice.lang || 'hi-IN';
                            } else {
                              utterance.lang = 'hi-IN';
                            }
                            
                            // Set speech parameters
                            utterance.rate = 0.7; // Slower for clarity
                            utterance.pitch = 1.0;
                            utterance.volume = 1.0;
                            
                            // Set up event handlers
                            utterance.onstart = () => {
                              setIsPlaying(true);
                              toast({
                                title: "Playing",
                                description: "Playing Sanskrit shloka",
                              });
                            };
                            
                            utterance.onend = () => {
                              setIsPlaying(false);
                            };
                            
                            utterance.onerror = (event) => {
                              console.error('Speech error:', event);
                              setIsPlaying(false);
                              let errorMsg = "Failed to play audio. Please try again.";
                              if (event.error === 'not-allowed') {
                                errorMsg = "Permission denied. Please allow audio playback in your browser settings.";
                              } else if (event.error === 'synthesis-failed') {
                                errorMsg = "Speech synthesis failed. Your device may not support this language.";
                              }
                              toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive",
                              });
                            };
                            
                            // Play the speech
                            try {
                              speechSynthesis.speak(utterance);
                            } catch (speakError) {
                              console.error('Speak error:', speakError);
                              setIsPlaying(false);
                              toast({
                                title: "Error",
                                description: "Failed to start playback. Please try again.",
                                variant: "destructive",
                              });
                            }
                            
                          } catch (error) {
                            console.error('Error starting speech:', error);
                            setIsPlaying(false);
                            toast({
                              title: "Error",
                              description: "Failed to start audio playback. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                      >
                        <Volume2 className="mr-2 w-5 h-5" />
                        Play Audio
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Added on {new Date(plant.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PlantDetail;
