import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center max-w-md">
          <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
          <p className="mb-6 text-xl text-gray-600">Oops! Page not found</p>
          <p className="mb-8 text-gray-500">
            The page you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
