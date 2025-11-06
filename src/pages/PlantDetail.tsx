import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Leaf, 
  ArrowLeft, 
  AlertCircle,
  ImageIcon,
  BookOpen,
  Sprout,
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

const TTS_RESUME_NUDGE_MS = 250;

// -------- Sanskrit-only helpers --------
const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    if (voices && voices.length) return resolve(voices);
    const iv = setInterval(() => {
      voices = synth.getVoices();
      if (voices && voices.length) {
        clearInterval(iv);
        resolve(voices);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(iv);
      resolve(synth.getVoices() || []);
    }, 3000);
  });

// Strict Sanskrit voice pick: sa / sa-IN / name includes Sanskrit
const pickSanskritVoice = (voices: SpeechSynthesisVoice[]) => {
  const lower = (s?: string) => (s || "").toLowerCase();
  return (
    voices.find(v => lower(v.lang) === "sa" || lower(v.lang) === "sa-in") ||
    voices.find(v => lower(v.lang).startsWith("sa")) ||
    voices.find(v => lower(v.name).includes("sanskrit")) ||
    null
  );
};

// Chunk text to avoid Android stalls
const chunkText = (text: string, maxLen = 180) => {
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[।.!?])\s+/);
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length <= maxLen) {
      buf = (buf ? buf + " " : "") + s;
    } else {
      if (buf) chunks.push(buf);
      if (s.length <= maxLen) {
        buf = s;
      } else {
        for (let i = 0; i < s.length; i += maxLen) chunks.push(s.slice(i, i + maxLen));
        buf = "";
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
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

  // TTS refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const ttsStopRef = useRef<() => void>(() => {});
  const resumeNudgeRef = useRef<number | null>(null);
  const canceledRef = useRef<boolean>(false);

  useEffect(() => {
    if (id) loadPlant(id);
    if (!audioElementRef.current) audioElementRef.current = new Audio();
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        if ((fetchError as any).code === "PGRST116") setError("Plant not found");
        else throw fetchError;
        return;
      }
      if (!data) return setError("Plant not found");
      setPlant(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load plant details. Please try again.");
      toast({ title: "Error", description: "Failed to load plant details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearResumeNudge = () => {
    if (resumeNudgeRef.current) {
      window.clearInterval(resumeNudgeRef.current);
      resumeNudgeRef.current = null;
    }
  };

  const stopAudio = useCallback(() => {
    try {
      canceledRef.current = true;
      clearResumeNudge();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.src = "";
      }
    } finally {
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    ttsStopRef.current = stopAudio;
  }, [stopAudio]);

  const startResumeNudge = () => {
    clearResumeNudge();
    if ("speechSynthesis" in window) {
      resumeNudgeRef.current = window.setInterval(() => {
        try { window.speechSynthesis.resume(); } catch {}
      }, TTS_RESUME_NUDGE_MS);
    }
  };

  const speakChunk = (text: string): Promise<void> =>
    new Promise(async (resolve, reject) => {
      if (!("speechSynthesis" in window)) return reject(new Error("Speech synthesis not supported"));
      const utter = new SpeechSynthesisUtterance(text);

      // Sanskrit voice strictly
      if (!voiceRef.current) {
        const voices = await getVoicesAsync();
        voiceRef.current = pickSanskritVoice(voices);
      }

      // Always set Sanskrit language tag
      utter.lang = "sa-IN";

      // Assign voice only if truly Sanskrit (no Hindi/Marathi fallback)
      if (voiceRef.current) {
        utter.voice = voiceRef.current;
      }

      utter.rate = 0.9;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      utter.onstart = () => startResumeNudge();
      utter.onend = () => { clearResumeNudge(); resolve(); };
      utter.onerror = (e) => { clearResumeNudge(); reject(e.error || new Error("TTS error")); };

      setTimeout(() => {
        try { window.speechSynthesis.speak(utter); } catch (e) { reject(e); }
      }, 50);
    });

  const playShloka = useCallback(async (text: string) => {
    stopAudio();
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: "Error", description: "No text available to play", variant: "destructive" });
      return;
    }

    setIsPlaying(true);
    canceledRef.current = false;

    if ("speechSynthesis" in window) {
      try {
        // Preload voices & cache Sanskrit
        const voices = await getVoicesAsync();
        voiceRef.current = pickSanskritVoice(voices) || null;

        // Speak chunks sequentially (Sanskrit only)
        const chunks = chunkText(trimmed);
        for (let i = 0; i < chunks.length; i++) {
          if (canceledRef.current) break;
          await speakChunk(chunks[i]);
        }

        if (!canceledRef.current) setIsPlaying(false);
        return;
      } catch (err) {
        console.warn("Web Speech (Sanskrit) failed:", err);
      }
    }

    setIsPlaying(false);
    toast({
      title: "Sanskrit TTS unavailable",
      description:
        "This browser doesn't provide a Sanskrit voice. Try updating Chrome/Safari, or enable a Sanskrit TTS voice in the system.",
      variant: "destructive",
    });
  }, [stopAudio, toast]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && isPlaying && "speechSynthesis" in window) {
        try { window.speechSynthesis.resume(); } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [isPlaying]);

  // -------------------- UI (unchanged) --------------------
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
              {plant.images && plant.images.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-emerald-600" />
                      Images
                    </h2>
                  </div>
                  <div className="mb-4">
                    <img
                      src={plant.images[selectedImageIndex]}
                      alt={plant.name}
                      className="w-full h-96 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
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
                          <img src={image} alt={`${plant.name} ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
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

                  {plant.useful_parts && plant.useful_parts.length > 0 && (
                    <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-teal-600" />
                        Useful Parts
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {plant.useful_parts.map((part, index) => (
                          <span key={index} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {plant.indications && plant.indications.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        Indications
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {plant.indications.map((indication, index) => (
                          <span key={index} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {indication}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {plant.shloka != null && String(plant.shloka).trim() !== "" && (
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
                      <Button onClick={() => ttsStopRef.current()} size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-full">
                        <Pause className="mr-2 w-5 h-5" />
                        Stop Audio
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          const t = (plant.shloka || "").trim();
                          (async () => {
                            if (!("speechSynthesis" in window)) {
                              toast({
                                title: "Sanskrit TTS unavailable",
                                description: "This browser doesn't support speech synthesis.",
                                variant: "destructive",
                              });
                              return;
                            }
                            await playShloka(t);
                          })();
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
