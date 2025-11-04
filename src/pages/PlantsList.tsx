import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Leaf, 
  Search, 
  Loader2, 
  AlertCircle,
  Eye,
  ImageIcon,
  Sparkles,
  BookOpen,
  Sprout,
  FlaskConical
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
  images: string[];
  created_at: string;
};

const PlantsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlants(data || []);
    } catch (error) {
      console.error("Error loading plants:", error);
      toast({
        title: "Error",
        description: "Failed to load plants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = plants.filter(
    (plant) =>
      plant.name.toLowerCase().includes(query.toLowerCase()) ||
      plant.botanical_name?.toLowerCase().includes(query.toLowerCase()) ||
      plant.family?.toLowerCase().includes(query.toLowerCase()) ||
      plant.english_name?.toLowerCase().includes(query.toLowerCase())
  );

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
            <p className="text-gray-600 text-lg font-semibold">Loading plants...</p>
          </div>
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
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Explore Plants
              </h1>
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover ancient Ayurvedic wisdom through our comprehensive plant collection
            </p>
          </div>

          {/* Search Bar */}
          <div className="animate-fade-in-up animation-delay-200">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, botanical name, family, or English name..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Plants Count */}
          <div className="text-center animate-fade-in-up animation-delay-300">
            <p className="text-gray-600">
              {filteredPlants.length === 0 ? (
                <span>No plants found</span>
              ) : (
                <span>
                  Showing <span className="font-bold text-emerald-600">{filteredPlants.length}</span>{" "}
                  {filteredPlants.length === 1 ? "plant" : "plants"}
                </span>
              )}
            </p>
          </div>

          {/* Plants Grid */}
          {filteredPlants.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up animation-delay-400">
              <Leaf className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {query
                  ? "No plants found matching your search"
                  : "No plants available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-400">
              {filteredPlants.map((plant, index) => (
                <div
                  key={plant.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Plant Image or Placeholder */}
                  <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
                    {plant.images && plant.images.length > 0 ? (
                      <img
                        src={plant.images[0]}
                        alt={plant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-emerald-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  {/* Plant Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 break-words">
                      {plant.name}
                    </h3>
                    {plant.botanical_name && (
                      <p className="text-sm text-gray-600 italic mb-2 break-words">
                        {plant.botanical_name}
                      </p>
                    )}
                    {plant.english_name && (
                      <p className="text-sm text-gray-600 mb-3 break-words">
                        {plant.english_name}
                      </p>
                    )}
                    {plant.family && (
                      <p className="text-xs text-gray-500 mb-4 break-words">
                        Family: {plant.family}
                      </p>
                    )}

                    {/* Quick Info Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plant.useful_parts && plant.useful_parts.length > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <FlaskConical className="w-3 h-3" />
                          <span>{plant.useful_parts.length} parts</span>
                        </div>
                      )}
                      {plant.indications && plant.indications.length > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <BookOpen className="w-3 h-3" />
                          <span>{plant.indications.length} uses</span>
                        </div>
                      )}
                      {plant.shloka && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <Sprout className="w-3 h-3" />
                          <span>Shloka</span>
                        </div>
                      )}
                    </div>

                    {/* View Button */}
                    <Button
                      onClick={() => navigate(`/plants/${plant.id}`)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PlantsList;

