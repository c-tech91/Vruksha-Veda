import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <Hero />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
