import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TreeDeciduous, 
  Leaf, 
  Plus, 
  Search, 
  Eye, 
  Download, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ImageIcon
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Header from "@/components/Header";
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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
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

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      loadPlants();
    }
  }, [navigate]);

  const loadPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPlants(data || []);
    } catch (error) {
      console.error('Error loading plants:', error);
      toast({
        title: "Error",
        description: "Failed to load plants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const uploadImages = async (plantId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${plantId}/${Date.now()}-${i}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('plant-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
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
      // Process arrays
      const synonyms = formData.synonyms
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      const useful_parts = formData.useful_parts
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      const indications = formData.indications
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      // Create plant record
      const { data: newPlant, error: insertError } = await supabase
        .from('plants')
        .insert([{
          name: formData.name.trim(),
          botanical_name: formData.botanical_name.trim() || null,
          family: formData.family.trim() || null,
          synonyms,
          english_name: formData.english_name.trim() || null,
          useful_parts,
          indications,
          shloka: formData.shloka.trim() || null,
          source_document: formData.source_document.trim() || null,
          images: [],
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Upload images if any
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0 && newPlant) {
        imageUrls = await uploadImages(newPlant.id);
        
        // Update plant with image URLs
        const { error: updateError } = await supabase
          .from('plants')
          .update({ images: imageUrls })
          .eq('id', newPlant.id);
        
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Success",
        description: `${formData.name} added successfully!`,
      });
      
      // Reset form
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
      setShowAddForm(false);
      
      // Reload plants and show QR modal
      await loadPlants();
      if (newPlant) {
        setSelectedPlant({ ...newPlant, images: imageUrls });
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('Error adding plant:', error);
      toast({
        title: "Error",
        description: "Failed to add plant",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas || !selectedPlant) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${selectedPlant.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
    link.href = url;
    link.click();
  };

  const filteredPlants = plants.filter((plant) => {
    const searchLower = query.toLowerCase();
    return (
      plant.name.toLowerCase().includes(searchLower) ||
      (plant.botanical_name && plant.botanical_name.toLowerCase().includes(searchLower)) ||
      (plant.family && plant.family.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-emerald-200/20 rounded-full animate-ping" />
            <div className="absolute inset-0 border-4 border-t-emerald-400 border-emerald-200/20 rounded-full animate-spin" />
            <Leaf className="absolute inset-0 m-auto w-10 h-10 text-emerald-300 animate-gentle-float" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">VrukshaVeda</h2>
          <p className="text-emerald-200">Loading ancient wisdom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <Header />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
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
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-xl px-8 py-4 font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-105 transition-all group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="px-2">Add New Medicinal Plant</span>
            </button>
          </div>

          {/* Add Plant Form */}
          {showAddForm && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plant Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Plant Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Neem"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                  </div>

                  {/* Botanical Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Botanical Name
                    </label>
                    <input
                      type="text"
                      name="botanical_name"
                      value={formData.botanical_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Azadirachta indica"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                  </div>

                  {/* Family */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Family
                    </label>
                    <input
                      type="text"
                      name="family"
                      value={formData.family}
                      onChange={handleInputChange}
                      placeholder="e.g., Meliaceae"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                  </div>

                  {/* English Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      English Name
                    </label>
                    <input
                      type="text"
                      name="english_name"
                      value={formData.english_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Indian Lilac"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                  </div>

                  {/* Synonyms */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Synonyms
                    </label>
                    <input
                      type="text"
                      name="synonyms"
                      value={formData.synonyms}
                      onChange={handleInputChange}
                      placeholder="Nimba, Arishta, Margosa"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                    <p className="text-xs text-gray-500">Comma-separated</p>
                  </div>

                  {/* Useful Parts */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Useful Parts
                    </label>
                    <input
                      type="text"
                      name="useful_parts"
                      value={formData.useful_parts}
                      onChange={handleInputChange}
                      placeholder="Leaves, Bark, Seeds"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                    <p className="text-xs text-gray-500">Comma-separated</p>
                  </div>

                  {/* Indications */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Indications
                    </label>
                    <input
                      type="text"
                      name="indications"
                      value={formData.indications}
                      onChange={handleInputChange}
                      placeholder="Skin diseases, Fever"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                    <p className="text-xs text-gray-500">Comma-separated</p>
                  </div>

                  {/* Source Document */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Source Document
                    </label>
                    <input
                      type="text"
                      name="source_document"
                      value={formData.source_document}
                      onChange={handleInputChange}
                      placeholder="e.g., Charaka Samhita"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
                    />
                  </div>
                </div>

                {/* Sanskrit Shloka */}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700 font-serif"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Plant Images
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors h-40 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-10 h-10 text-emerald-600" />
                      <p className="text-gray-700 font-medium">
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} file(s) selected`
                          : "Click to upload images"}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG • Max 10MB each</p>
                    </div>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-4 px-6 font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Adding Plant...
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      Add to Repository
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative animate-fade-in-up animation-delay-400">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, family, or botanical name..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700"
            />
          </div>

          {/* Plants List */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Medicinal Plants Collection
              </h2>
              <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold">
                {filteredPlants.length} {filteredPlants.length === 1 ? "Plant" : "Plants"}
              </div>
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
                {filteredPlants.map((plant, idx) => (
                  <div
                    key={plant.id}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 hover:shadow-md hover:-translate-y-1 transition-all animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                          <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
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
                          onClick={() => window.open(`/plants/${plant.id}`, '_blank')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlant(plant);
                            setShowQRModal(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>QR</span>
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-zoom-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">QR Code</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedPlant.name}</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-center">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={`${window.location.origin}/plants/${selectedPlant.id}`}
                size={220}
                level="H"
                includeMargin
              />
            </div>

            <button
              onClick={downloadQR}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors mb-3"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>

            <p className="text-xs text-gray-500 text-center px-4">
              Scanning opens the plant detail page even without login.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
