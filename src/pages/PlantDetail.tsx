import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  Pause,
  Edit,
  X,
  Save,
  Trash2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  audio_url?: string | null;
  created_at: string;
  updated_at?: string;
};

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFromAdmin, setIsFromAdmin] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioToDelete, setAudioToDelete] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const isStoppedManuallyRef = useRef(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    botanical_name: "",
    family: "",
    synonyms: "",
    english_name: "",
    useful_parts: "",
    indications: "",
    shloka: "",
    source_document: "",
    audio_url: "",
  });

  useEffect(() => {
    // Check if user is admin (authenticated)
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkAdmin();

    // Check if coming from admin dashboard
    const fromAdmin = searchParams.get("from") === "admin";
    setIsFromAdmin(fromAdmin);

    if (id) {
      loadPlant(id);
    }

    // Create audio element for streaming audio playback
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.preload = 'auto';
      
      // Set up event listeners for audio element
      audioElementRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        setAudioLoading(false);
      });
      
      audioElementRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      
      audioElementRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioLoading(false);
      });
      
      // Error listener - only log, don't show toast here
      // Toast will be shown in playAudio function if needed
      audioElementRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setAudioLoading(false);
        // Don't show toast here - let playAudio function handle it
      });
      
      audioElementRef.current.addEventListener('loadstart', () => {
        setAudioLoading(true);
      });
      
      audioElementRef.current.addEventListener('canplay', () => {
        setAudioLoading(false);
      });
    }

    // Cleanup: stop any ongoing audio when component unmounts
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current.load();
      }
      // Stop TTS if playing
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, [id, searchParams, toast]);

  // Stop audio playback function
  const stopAudio = () => {
    // Mark that audio was stopped manually (not due to error)
    isStoppedManuallyRef.current = true;
    
    // Stop HTML5 audio element (for streaming audio)
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.src = '';
      audioElementRef.current.load();
    }
    
    // Stop Web Speech API (for TTS fallback)
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
    setAudioLoading(false);
  };

  // Play audio (streaming MP3 or TTS fallback)
  const playAudio = async () => {
    if (!plant) return;

    const textToSpeak = (plant.shloka || '').trim();
    
    if (!textToSpeak || textToSpeak.length === 0) {
      toast({
        title: "Error",
        description: "No text available to play",
        variant: "destructive",
      });
      return;
    }

    // Reset manual stop flag
    isStoppedManuallyRef.current = false;
    
    // Stop any existing audio first
    stopAudio();
    
    // Small delay to ensure stopAudio completes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if audio URL exists in database
    if (plant.audio_url && plant.audio_url.trim() !== '') {
      // Use streaming audio from database
      try {
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
          // Set up basic event listeners
          audioElementRef.current.addEventListener('play', () => {
            setIsPlaying(true);
            setAudioLoading(false);
          });
          audioElementRef.current.addEventListener('pause', () => {
            setIsPlaying(false);
          });
          audioElementRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
            setAudioLoading(false);
          });
          audioElementRef.current.addEventListener('error', () => {
            setIsPlaying(false);
            setAudioLoading(false);
          });
        }

        // Set up one-time error handler for this specific playback attempt
        let errorHandled = false;
        const handleError = () => {
          // Don't handle error if audio was stopped manually
          if (isStoppedManuallyRef.current) {
            return;
          }
          
          if (!errorHandled) {
            errorHandled = true;
            console.error('Audio playback failed');
            setAudioLoading(false);
            setIsPlaying(false);
            
            // Only show error if we actually tried to play audio and it wasn't stopped manually
            if (!isStoppedManuallyRef.current) {
              toast({
                title: "Audio Error",
                description: "Failed to play audio. Using text-to-speech instead.",
                variant: "destructive",
              });
              
              // Fallback to TTS only if not stopped manually
              playTTS(textToSpeak).catch(err => {
                console.error('TTS fallback also failed:', err);
              });
            }
          }
        };

        // Remove any existing error listeners to avoid duplicates
        const errorHandler = () => handleError();
        audioElementRef.current.addEventListener('error', errorHandler, { once: true });
        audioElementRef.current.addEventListener('abort', errorHandler, { once: true });

        audioElementRef.current.src = plant.audio_url;
        audioElementRef.current.load();
        
        setAudioLoading(true);
        
        // Wait for audio to be ready to play
        try {
          await new Promise<void>((resolve, reject) => {
            if (!audioElementRef.current) {
              reject(new Error('Audio element not available'));
              return;
            }

            const timeout = setTimeout(() => {
              if (!errorHandled) {
                handleError();
              }
              reject(new Error('Audio load timeout'));
            }, 10000); // 10 second timeout

            const onCanPlay = () => {
              clearTimeout(timeout);
              resolve();
            };

            const onError = () => {
              clearTimeout(timeout);
              // Don't handle error if stopped manually
              if (!isStoppedManuallyRef.current && !errorHandled) {
                handleError();
              }
              reject(new Error('Audio load error'));
            };

            audioElementRef.current.addEventListener('canplaythrough', onCanPlay, { once: true });
            audioElementRef.current.addEventListener('canplay', onCanPlay, { once: true });
            audioElementRef.current.addEventListener('error', onError, { once: true });
          });
          
          // Play the audio
          const playPromise = audioElementRef.current.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            // Success - audio is playing
            toast({
              title: "Playing",
              description: "Playing shloka audio",
            });
          }
        } catch (loadError) {
          // Error already handled by handleError, just log
          // Don't handle if stopped manually
          if (!isStoppedManuallyRef.current) {
            console.error('Audio load/play error:', loadError);
            if (!errorHandled) {
              handleError();
            }
          }
        }
      } catch (error) {
        // Don't handle error if stopped manually
        if (!isStoppedManuallyRef.current) {
          console.error('Error playing audio:', error);
          setAudioLoading(false);
          setIsPlaying(false);
          
          // Only show error toast if we actually had an audio URL to play
          // If it's just a load error, the error handler above will show the toast
          // This catch is for play() promise rejections
          if (error instanceof Error && !error.message.includes('timeout')) {
            toast({
              title: "Audio Error",
              description: "Failed to play audio. Using text-to-speech instead.",
              variant: "destructive",
            });
          }
          
          // Fallback to TTS only if not stopped manually
          await playTTS(textToSpeak);
        }
      }
    } else {
      // No audio URL in database - silently use TTS fallback (no error message)
      await playTTS(textToSpeak);
    }
  };

  // Play TTS (fallback when no audio URL)
  const playTTS = async (textToSpeak: string) => {
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
        description: "Playing Sanskrit shloka (Text-to-Speech)",
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
  };

  // Get high-quality image URL (for Supabase storage)
  const getHighQualityImageUrl = (url: string) => {
    if (!url) return url;
    // If it's a Supabase storage URL, we can add transform parameters
    // For now, return the original URL (Supabase serves high quality by default)
    // You can add transform parameters if needed: ?width=1920&quality=90
    return url;
  };

  // Handle file selection for edit
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Handle audio file selection for edit
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File",
          description: "Please select an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        });
        return;
      }
      setSelectedAudioFile(file);
    }
  };

  // Remove existing image
  const handleRemoveImage = (imageUrl: string) => {
    setExistingImages(existingImages.filter(img => img !== imageUrl));
    setImagesToDelete([...imagesToDelete, imageUrl]);
  };

  // Upload new images
  const uploadImages = async (plantId: string): Promise<string[]> => {
    const imageUrls: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${plantId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("plant-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("plant-images")
        .getPublicUrl(fileName);

      imageUrls.push(publicUrl);
    }

    return imageUrls;
  };

  // Upload audio file
  const uploadAudio = async (plantId: string): Promise<string | null> => {
    if (!selectedAudioFile) return null;

    const fileExt = selectedAudioFile.name.split(".").pop();
    const fileName = `${plantId}/audio-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("plant-audio")
      .upload(fileName, selectedAudioFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("plant-audio")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Delete audio from storage
  const deleteAudioFromStorage = async (audioUrl: string) => {
    try {
      const urlObj = new URL(audioUrl);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('plant-audio');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        const { error } = await supabase.storage
          .from("plant-audio")
          .remove([filePath]);

        if (error) {
          console.error(`Error deleting audio ${filePath}:`, error);
        }
      }
    } catch (err) {
      console.error(`Error deleting audio ${audioUrl}:`, err);
    }
  };

  // Delete images from storage
  const deleteImagesFromStorage = async (imageUrls: string[]) => {
    for (const url of imageUrls) {
      try {
        // Extract file path from Supabase storage URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/plant-images/[plantId]/[filename]
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.indexOf('plant-images');
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          // Get the path after 'plant-images'
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          const { error } = await supabase.storage
            .from("plant-images")
            .remove([filePath]);

          if (error) {
            console.error(`Error deleting image ${filePath}:`, error);
          }
        }
      } catch (err) {
        console.error(`Error deleting image ${url}:`, err);
      }
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only admins can edit plants",
        variant: "destructive",
      });
      return;
    }

    if (!plant || !id) return;

    if (!editFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Plant name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        newImageUrls = await uploadImages(id);
      }

      // Combine existing images (minus deleted ones) with new images
      const finalImages = [
        ...existingImages.filter(img => !imagesToDelete.includes(img)),
        ...newImageUrls,
      ];

      // Delete removed images from storage
      if (imagesToDelete.length > 0) {
        await deleteImagesFromStorage(imagesToDelete);
      }

      // Handle audio upload/delete
      let finalAudioUrl: string | null = null;
      
      if (audioToDelete && plant.audio_url) {
        // Delete existing audio
        await deleteAudioFromStorage(plant.audio_url);
        finalAudioUrl = null;
      } else if (selectedAudioFile) {
        // Upload new audio
        // Delete old audio if exists
        if (plant.audio_url) {
          await deleteAudioFromStorage(plant.audio_url);
        }
        finalAudioUrl = await uploadAudio(id);
      } else if (plant.audio_url) {
        // Keep existing audio
        finalAudioUrl = plant.audio_url;
      }

      // Update plant data
      const updateData = {
        name: editFormData.name.trim(),
        botanical_name: editFormData.botanical_name.trim() || null,
        family: editFormData.family.trim() || null,
        synonyms: editFormData.synonyms
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        english_name: editFormData.english_name.trim() || null,
        useful_parts: editFormData.useful_parts
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        indications: editFormData.indications
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        shloka: editFormData.shloka.trim() || null,
        source_document: editFormData.source_document.trim() || null,
        images: finalImages,
        audio_url: finalAudioUrl,
      };

      const { error: updateError } = await supabase
        .from("plants")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Plant updated successfully!",
      });

      // Reload plant data
      await loadPlant(id);
      setShowEditForm(false);
      setSelectedFiles([]);
      setImagesToDelete([]);
      setSelectedAudioFile(null);
      setAudioToDelete(false);
    } catch (error) {
      console.error("Error updating plant:", error);
      toast({
        title: "Error",
        description: "Failed to update plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change for edit form
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
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

      // Ensure arrays are properly formatted (handle null/undefined)
      const formattedData: Plant = {
        ...data,
        synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
        useful_parts: Array.isArray(data.useful_parts) ? data.useful_parts : [],
        indications: Array.isArray(data.indications) ? data.indications : [],
        images: Array.isArray(data.images) ? data.images : [],
        audio_url: (data as any).audio_url || null,
      };

      setPlant(formattedData);
      setExistingImages(formattedData.images || []);
      
      // Populate edit form
      setEditFormData({
        name: formattedData.name || "",
        botanical_name: formattedData.botanical_name || "",
        family: formattedData.family || "",
        synonyms: formattedData.synonyms?.join(", ") || "",
        english_name: formattedData.english_name || "",
        useful_parts: formattedData.useful_parts?.join(", ") || "",
        indications: formattedData.indications?.join(", ") || "",
        shloka: formattedData.shloka || "",
        source_document: formattedData.source_document || "",
        audio_url: formattedData.audio_url || "",
      });
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
          {/* Navigation Buttons */}
          <div className="flex gap-3 mb-6 items-center justify-between">
            <div className="flex gap-3">
              {isAdmin && isFromAdmin ? (
                // Admin coming from admin dashboard - show only back button
                <Button
                  onClick={() => navigate("/admin")}
                  variant="ghost"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              ) : (
                // Public user or admin not from dashboard - show both buttons
                <>
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
                </>
              )}
            </div>
            {/* Edit Button - Only for Admin */}
            {isAdmin && (
              <Button
                onClick={() => setShowEditForm(!showEditForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {showEditForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Edit
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Plant
                  </>
                )}
              </Button>
            )}
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
                      src={getHighQualityImageUrl(plant.images[selectedImageIndex])}
                      alt={plant.name}
                      className="w-full h-96 object-cover rounded-2xl shadow-lg"
                      loading="lazy"
                      style={{ imageRendering: "auto" }}
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
                            src={getHighQualityImageUrl(image)}
                            alt={`${plant.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
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
                  
                  <div className="flex justify-center gap-3 flex-col items-center">
                    {plant.audio_url && plant.audio_url.trim() !== '' && (
                      <p className="text-sm text-purple-600 mb-2">
                        🎵 Audio available from database
                      </p>
                    )}
                    {isPlaying ? (
                      <Button
                        onClick={() => {
                          stopAudio();
                        }}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                        disabled={audioLoading}
                      >
                        {audioLoading ? (
                          <>
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Pause className="mr-2 w-5 h-5" />
                            Stop Audio
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={playAudio}
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                        disabled={audioLoading}
                      >
                        {audioLoading ? (
                          <>
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Volume2 className="mr-2 w-5 h-5" />
                            {plant.audio_url && plant.audio_url.trim() !== '' 
                              ? "Play Audio" 
                              : "Play Audio (TTS)"}
                          </>
                        )}
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
                  {plant.updated_at && (
                    <span className="ml-4">
                      • Updated on {new Date(plant.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form Section - Only for Admin */}
          {showEditForm && isAdmin && (
            <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Edit className="w-6 h-6 text-emerald-600" />
                Edit Plant Details
              </h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">
                      Plant Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      placeholder="e.g., Neem"
                      required
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-botanical_name" className="text-sm font-semibold text-gray-700">
                      Botanical Name
                    </Label>
                    <Input
                      id="edit-botanical_name"
                      name="botanical_name"
                      value={editFormData.botanical_name}
                      onChange={handleEditInputChange}
                      placeholder="e.g., Azadirachta indica"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-family" className="text-sm font-semibold text-gray-700">
                      Family
                    </Label>
                    <Input
                      id="edit-family"
                      name="family"
                      value={editFormData.family}
                      onChange={handleEditInputChange}
                      placeholder="e.g., Meliaceae"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-english_name" className="text-sm font-semibold text-gray-700">
                      English Name
                    </Label>
                    <Input
                      id="edit-english_name"
                      name="english_name"
                      value={editFormData.english_name}
                      onChange={handleEditInputChange}
                      placeholder="e.g., Indian Lilac"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-synonyms" className="text-sm font-semibold text-gray-700">
                      Synonyms
                    </Label>
                    <Input
                      id="edit-synonyms"
                      name="synonyms"
                      value={editFormData.synonyms}
                      onChange={handleEditInputChange}
                      placeholder="Nimba, Arishta, Margosa"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                    <p className="text-xs text-gray-500">Comma-separated</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-useful_parts" className="text-sm font-semibold text-gray-700">
                      Useful Parts
                    </Label>
                    <Input
                      id="edit-useful_parts"
                      name="useful_parts"
                      value={editFormData.useful_parts}
                      onChange={handleEditInputChange}
                      placeholder="Leaves, Bark, Seeds"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                    <p className="text-xs text-gray-500">Comma-separated</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-indications" className="text-sm font-semibold text-gray-700">
                      Indications
                    </Label>
                    <Input
                      id="edit-indications"
                      name="indications"
                      value={editFormData.indications}
                      onChange={handleEditInputChange}
                      placeholder="Skin diseases, Fever"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                    <p className="text-xs text-gray-500">Comma-separated</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-source_document" className="text-sm font-semibold text-gray-700">
                      Source Document
                    </Label>
                    <Input
                      id="edit-source_document"
                      name="source_document"
                      value={editFormData.source_document}
                      onChange={handleEditInputChange}
                      placeholder="e.g., Charaka Samhita"
                      className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-shloka" className="text-sm font-semibold text-gray-700">
                    Sanskrit Shloka (Optional)
                  </Label>
                  <Textarea
                    id="edit-shloka"
                    name="shloka"
                    value={editFormData.shloka}
                    onChange={handleEditInputChange}
                    placeholder="निम्बति स्यान्निम्बको अरिष्टः..."
                    rows={4}
                    className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 font-serif"
                  />
                </div>

                {/* Audio Upload Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Shloka Audio (MP3) - Optional
                  </Label>
                  {plant.audio_url && plant.audio_url.trim() !== '' && !audioToDelete && (
                    <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-purple-700">Audio file is uploaded</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setAudioToDelete(true)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      {!audioToDelete && (
                        <audio 
                          src={plant.audio_url} 
                          controls 
                          className="w-full mt-2"
                          preload="metadata"
                        />
                      )}
                    </div>
                  )}
                  {(!plant.audio_url || audioToDelete || selectedAudioFile) && (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all">
                      <Volume2 className="w-8 h-8 text-purple-600 mb-2" />
                      <span className="text-gray-600 text-sm">Click to upload audio file</span>
                      <span className="text-xs text-gray-500 mt-1">
                        MP3, WAV, OGG • Max 10MB
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  {selectedAudioFile && (
                    <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mt-2">
                      <Volume2 className="w-4 h-4" />
                      <span className="text-sm">{selectedAudioFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAudioFile(null)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    If audio is uploaded, it will be used instead of text-to-speech. If no audio is provided, TTS will be used as fallback.
                  </p>
                </div>

                {/* Existing Images Management */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Existing Images
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={getHighQualityImageUrl(imageUrl)}
                            alt={`${plant.name} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imageUrl)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Add New Images
                  </Label>
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all">
                    <ImageIcon className="w-10 h-10 text-emerald-600 mb-2" />
                    <span className="text-gray-600">Click to upload images</span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG • Max 10MB each
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="px-2">Updating Plant...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        <span className="px-2">Save Changes</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedFiles([]);
                      setImagesToDelete([]);
                      setSelectedAudioFile(null);
                      setAudioToDelete(false);
                      // Reset form to original values
                      if (plant) {
                        setEditFormData({
                          name: plant.name || "",
                          botanical_name: plant.botanical_name || "",
                          family: plant.family || "",
                          synonyms: plant.synonyms?.join(", ") || "",
                          english_name: plant.english_name || "",
                          useful_parts: plant.useful_parts?.join(", ") || "",
                          indications: plant.indications?.join(", ") || "",
                          shloka: plant.shloka || "",
                          source_document: plant.source_document || "",
                          audio_url: plant.audio_url || "",
                        });
                        setExistingImages(plant.images || []);
                      }
                    }}
                    variant="outline"
                    className="px-6 border-2 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PlantDetail;
