import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl shadow-lg"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group"
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                isScrolled
                  ? "bg-gradient-to-br from-primary to-secondary"
                  : "bg-gradient-to-br from-primary to-secondary"
              }`}
            >
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span
              className={`text-xl sm:text-2xl font-bold transition-all ${
                isScrolled
                  ? "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              VrukshaVeda
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/">
                  <Button
                    variant="ghost"
                    className={`rounded-full px-4 py-2.5 transition-all ${
                      isScrolled
                        ? "bg-emerald-50 text-primary hover:bg-emerald-100"
                        : "bg-white/90 text-primary hover:bg-white backdrop-blur-sm"
                    } ${location.pathname === "/" ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <span className="px-2">Home</span>
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button
                    variant="ghost"
                    className={`rounded-full px-4 py-2.5 transition-all ${
                      isScrolled
                        ? "bg-emerald-50 text-primary hover:bg-emerald-100"
                        : "bg-white/90 text-primary hover:bg-white backdrop-blur-sm"
                    } ${location.pathname === "/admin" ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <span className="px-2">Admin</span>
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  className="rounded-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <span className="px-2">Logout</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button
                  className={`rounded-full px-4 py-2.5 transition-all ${
                    isScrolled
                      ? "bg-gradient-to-r from-primary to-secondary text-white"
                      : "bg-white/90 text-primary hover:bg-white backdrop-blur-sm"
                  }`}
                >
                  <span className="px-2">Admin Login</span>
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-all ${
              isScrolled
                ? "bg-emerald-50 text-primary"
                : "bg-white/90 text-primary backdrop-blur-sm"
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl mt-2 mb-4 animate-fade-in">
            <nav className="flex flex-col gap-2 px-4">
              {isAuthenticated ? (
                <>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl hover:bg-emerald-50"
                    >
                      Home
                    </Button>
                  </Link>
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl hover:bg-emerald-50"
                    >
                      Admin
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-xl">
                    Admin Login
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
