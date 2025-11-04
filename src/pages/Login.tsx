import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/admin");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      // Log for debugging
      console.log("Login attempt:", {
        email: email.trim().toLowerCase(),
        hasError: !!error,
        hasSession: !!data?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name,
        } : null,
      });

      if (error) {
        // Log full error details
        console.error("🔴 Supabase auth error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
          code: (error as any).code,
        });
        
        // Handle specific error cases with clear messages
        let errorMessage = error.message || "Failed to sign in. Please try again.";
        
        // Check for "Invalid API key" error specifically
        if (error.message.toLowerCase().includes("invalid api key") || 
            error.message.toLowerCase().includes("invalid api_key")) {
          errorMessage = "❌ Invalid Supabase API key! Please check your .env file and restart the dev server. The API key might be incorrect or expired.";
          console.error("❌ API KEY ERROR: Check your .env file - VITE_SUPABASE_PUBLISHABLE_KEY might be wrong or the dev server needs restart.");
        } else if (error.message.toLowerCase().includes("invalid login credentials") || 
            error.message.toLowerCase().includes("invalid email or password")) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message.toLowerCase().includes("email not confirmed") || 
                   error.message.toLowerCase().includes("email_not_confirmed")) {
          errorMessage = "Please verify your email address. Check your inbox for a confirmation email.";
        } else if (error.message.toLowerCase().includes("too many requests") || error.status === 429) {
          errorMessage = "Too many login attempts. Please wait a moment and try again.";
        } else if (error.status === 401) {
          // If it's a 401 but not about API key, it's likely credentials
          if (!error.message.toLowerCase().includes("api key")) {
            errorMessage = "Invalid email or password. Please verify your credentials.";
          }
        } else if (error.status === 400) {
          errorMessage = "Invalid request. Please check your email and password format.";
        }

        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verify session was created
      if (!data.session) {
        console.error("No session created after successful login");
        toast({
          title: "Login failed",
          description: "Session was not created. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Success - session created
      console.log("✅ Login successful, session created");
      
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to VrukshaVeda",
      });
      
      // Navigate to admin page
      navigate("/admin");
      
    } catch (error) {
      console.error("Unexpected login error:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred. Please try again.";
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex flex-col">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-24">
        <div className="w-full max-w-md animate-zoom-in">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Leaf className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Admin Login
              </h1>
              <p className="text-muted-foreground">
                Access the VrukshaVeda management portal
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  className="mt-2 border-2 border-gray-200 focus:border-primary rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="mt-2 border-2 border-gray-200 focus:border-primary rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-accent hover:to-primary text-white rounded-xl py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="px-2">Logging in...</span>
                  </>
                ) : (
                  <span className="px-6">Sign In</span>
                )}
              </Button>
            </form>

          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
