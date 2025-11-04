import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Leaf, Database, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: Database,
      title: "Comprehensive Database",
      description: "Extensive collection of Ayurvedic plants with detailed information",
      gradient: "from-primary to-secondary",
    },
    {
      icon: Leaf,
      title: "Ancient Wisdom",
      description: "Authentic Sanskrit shlokas and traditional knowledge",
      gradient: "from-secondary to-accent",
    },
    {
      icon: Shield,
      title: "Digital Preservation",
      description: "QR-enabled access for modern learning and sharing",
      gradient: "from-accent to-primary",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: 0.8,
        }}
      />

      {/* Animated Gradient Blobs */}
      <div className="fixed inset-0 z-10">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-96 h-96 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Dark Overlay */}
      <div className="fixed inset-0 z-20 bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-green-900/20" />

      {/* Floating Particles */}
      <div className="fixed inset-0 z-20 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Leaf
            key={i}
            className="absolute text-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-50px`,
              width: `${10 + Math.random() * 30}px`,
              height: `${10 + Math.random() * 30}px`,
              animation: `float-particle ${10 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-30 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div
          className="max-w-7xl mx-auto text-center"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-sm text-white font-medium">
              Ancient Wisdom, Modern Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6 animate-fade-in-up">
            <span className="text-white block mb-2">Preserve Your Roots</span>
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-green-300 bg-clip-text text-transparent animate-fade-in-up animation-delay-200">
              Know Ayurveda
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-emerald-50 max-w-4xl mx-auto mb-12 animate-fade-in-up animation-delay-400">
            Digital preservation of ancient herbal wisdom for future generations
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up animation-delay-600">
            <Link to="/plants">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-white text-primary hover:bg-gray-50 hover:scale-105 transition-all shadow-xl"
              >
                <span className="px-2">Explore Plants</span>
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/90 backdrop-blur-lg border border-white/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all animate-fade-in-up"
                style={{ animationDelay: `${0.8 + i * 0.1}s` }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 mx-auto`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
