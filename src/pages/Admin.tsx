import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TreeDeciduous, 
  Leaf, 
  Plus, 
  Search, 
  Eye, 
  Download, 
  ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Volume2
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

type FormData = {
  name: string;
  botanical_name: string;
  family: string;
  synonyms: string;
  english_name: string;
  useful_parts: string;
  indications: string;
  shloka: string;
  source_document: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    botanical_name: "",
    family: "",
    synonyms: "",
    english_name: "",
    useful_parts: "",
    indications: "",
    shloka: "",
    source_document: "",
  });

  const loadPlants = useCallback(async () => {
    try {
      // Verify session before loading plants
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Handle specific Supabase errors
        if (error.code === "PGRST116" || error.message.includes("JWT")) {
          // Session expired or invalid
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please login again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate("/login");
          return;
        }
        throw error;
      }
      
      setPlants(data || []);
    } catch (error) {
      console.error("Error loading plants:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load plants";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          toast({
            title: "Authentication Error",
            description: "Failed to verify session. Please login again.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        if (!session) {
          navigate("/login");
          return;
        }

        // User is authenticated, load plants
        loadPlants();
      } catch (error) {
        console.error("Unexpected error during auth check:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        navigate("/login");
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/login");
      } else if (event === "SIGNED_IN" && session) {
        loadPlants();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, loadPlants]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

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

  const uploadImages = async (plantId: string): Promise<string[]> => {
    const imageUrls: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${plantId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Plant name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const plantData = {
        name: formData.name.trim(),
        botanical_name: formData.botanical_name.trim() || null,
        family: formData.family.trim() || null,
        synonyms: formData.synonyms
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        english_name: formData.english_name.trim() || null,
        useful_parts: formData.useful_parts
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        indications: formData.indications
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        shloka: formData.shloka.trim() || null,
        source_document: formData.source_document.trim() || null,
        images: [],
      };

      const { data: plant, error: insertError } = await supabase
        .from("plants")
        .insert([plantData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (selectedFiles.length > 0) {
        const imageUrls = await uploadImages(plant.id);
        const { error: updateError } = await supabase
          .from("plants")
          .update({ images: imageUrls })
          .eq("id", plant.id);

        if (updateError) throw updateError;
        plant.images = imageUrls;
      }

      // Upload audio if provided
      if (selectedAudioFile) {
        const audioUrl = await uploadAudio(plant.id);
        if (audioUrl) {
          const { error: updateError } = await supabase
            .from("plants")
            .update({ audio_url: audioUrl })
            .eq("id", plant.id);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Success",
        description: `${formData.name} added successfully!`,
      });

      setFormData({
        name: "",
        botanical_name: "",
        family: "",
        synonyms: "",
        english_name: "",
        useful_parts: "",
        indications: "",
        shloka: "",
        source_document: "",
      });
      setSelectedFiles([]);
      setSelectedAudioFile(null);
      setShowAddForm(false);
      setSelectedPlant(plant);
      setShowQRModal(true);
      loadPlants();
    } catch (error) {
      console.error("Error adding plant:", error);
      toast({
        title: "Error",
        description: "Failed to add plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas || !selectedPlant) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${selectedPlant.name.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    link.href = url;
    link.click();
  };

  const filteredPlants = plants.filter(
    (plant) =>
      plant.name.toLowerCase().includes(query.toLowerCase()) ||
      plant.botanical_name?.toLowerCase().includes(query.toLowerCase()) ||
      plant.family?.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-teal-300 border-t-transparent animate-spin animation-delay-200" />
            <Leaf className="absolute inset-0 m-auto w-8 h-8 text-white animate-gentle-float" />
          </div>
          <p className="text-white text-lg font-semibold">Loading ancient wisdom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex flex-col">
      <Header />

      <div className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-4 mb-4">
              <TreeDeciduous className="w-12 h-12 text-emerald-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Ayurveda Repository
              </h1>
              <Leaf className="w-12 h-12 text-teal-600" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Digital Preservation of Ancient Herbal Wisdom
            </p>
          </div>

          {/* Add Plant Button */}
          <div className="animate-fade-in-up animation-delay-200">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full group bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-xl px-8 py-4 hover:shadow-2xl transition-all flex items-center justify-center gap-3 font-semibold text-lg"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="px-2">Add New Medicinal Plant</span>
            </button>
          </div>

          {/* Add Plant Form */}
          {showAddForm && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Plant Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Neem"
                    required
                  />
                  <InputField
                    label="Botanical Name"
                    name="botanical_name"
                    value={formData.botanical_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Azadirachta indica"
                  />
                  <InputField
                    label="Family"
                    name="family"
                    value={formData.family}
                    onChange={handleInputChange}
                    placeholder="e.g., Meliaceae"
                  />
                  <InputField
                    label="English Name"
                    name="english_name"
                    value={formData.english_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Indian Lilac"
                  />
                  <InputField
                    label="Synonyms"
                    name="synonyms"
                    value={formData.synonyms}
                    onChange={handleInputChange}
                    placeholder="Nimba, Arishta, Margosa"
                    helper="Comma-separated"
                  />
                  <InputField
                    label="Useful Parts"
                    name="useful_parts"
                    value={formData.useful_parts}
                    onChange={handleInputChange}
                    placeholder="Leaves, Bark, Seeds"
                    helper="Comma-separated"
                  />
                  <InputField
                    label="Indications"
                    name="indications"
                    value={formData.indications}
                    onChange={handleInputChange}
                    placeholder="Skin diseases, Fever"
                    helper="Comma-separated"
                  />
                  <InputField
                    label="Source Document"
                    name="source_document"
                    value={formData.source_document}
                    onChange={handleInputChange}
                    placeholder="e.g., Charaka Samhita"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Sanskrit Shloka (Optional)
                  </label>
                  <textarea
                    name="shloka"
                    value={formData.shloka}
                    onChange={handleInputChange}
                    placeholder="निम्बति स्यान्निम्बको अरिष्टः..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-serif"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Shloka Audio (MP3) - Optional
                  </label>
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Plant Images
                  </label>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="px-2">Adding Plant...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      <span className="px-2">Add to Repository</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Search Bar */}
          <div className="animate-fade-in-up animation-delay-400">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, family, or botanical name..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Plants List */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Medicinal Plants Collection
              </h2>
              <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold">
                {filteredPlants.length} {filteredPlants.length === 1 ? "Plant" : "Plants"}
              </span>
            </div>

            {filteredPlants.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {query
                    ? "No plants found matching your search"
                    : "No plants added yet. Start building your digital garden!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlants.map((plant, index) => (
                  <div
                    key={plant.id}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {plant.name}
                        </h3>
                        {plant.botanical_name && (
                          <p className="text-sm text-gray-600 italic truncate">
                            {plant.botanical_name}
                          </p>
                        )}
                        {plant.family && (
                          <p className="text-xs text-gray-500">
                            Family: {plant.family}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/plants/${plant.id}?from=admin`)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlant(plant);
                          setShowQRModal(true);
                        }}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>QR</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedPlant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-zoom-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">QR Code</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedPlant.name}</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <QRCodeCanvas
                  ref={qrRef}
                  value={`${import.meta.env.VITE_BASE_URL || window.location.origin}/plants/${selectedPlant.id}`}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>

              <button
                onClick={downloadQR}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>

              <p className="text-xs text-gray-500 text-center px-4">
                Scanning opens the plant detail page even without login.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

// InputField Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  helper,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  helper?: string;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-gray-700 transition-all"
    />
    {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
  </div>
);

export default Admin;
