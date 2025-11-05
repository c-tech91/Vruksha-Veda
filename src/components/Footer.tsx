import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative mt-auto">
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-teal-900/95 to-green-900/95 backdrop-blur-sm"></div>
      
      {/* Content with fully opaque text */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                VrukshaVeda
              </span>
            </Link>
            <p className="text-white text-sm leading-relaxed">
              Preserving ancient Ayurvedic wisdom through modern technology
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-white hover:text-emerald-300 transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/plants"
                  className="text-white hover:text-emerald-300 transition-colors text-sm"
                >
                  Explore Plants
                </Link>
              </li>
            </ul>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">About</h3>
            <p className="text-white text-sm leading-relaxed">
              A digital repository for Ayurvedic medicinal plants, preserving ancient knowledge for future generations.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8">
          {/* Credits */}
          <div className="text-center space-y-3">
            <p className="text-white text-base leading-relaxed">
              🌿 Developed by <span className="font-semibold">Vedang Kulkarni</span> & <span className="font-semibold">Kritish Bokade</span>
            </p>
            <p className="text-white text-sm">
              Department of Computer Technology, Yeshwantrao Chavan College of Engineering
            </p>
            <p className="text-white text-lg font-semibold italic mt-4">
              "Preserving nature through knowledge — VrukshaVeda"
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-white text-xs">
            © {new Date().getFullYear()} VrukshaVeda. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

