import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TreeDeciduous, Leaf } from "lucide-react";
import Header from "@/components/Header";

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="flex items-center justify-center gap-4 mb-4">
              <TreeDeciduous className="w-12 h-12 text-primary" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Plant Management
              </h1>
              <Leaf className="w-12 h-12 text-secondary" />
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Digital Preservation of Ancient Herbal Wisdom
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 text-center animate-zoom-in">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-12 h-12 text-white animate-gentle-float" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Plant Database Coming Soon
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The comprehensive plant management system with QR code generation, 
                image galleries, and detailed Ayurvedic information is being prepared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
