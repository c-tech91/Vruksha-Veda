import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        localStorage.setItem("isAuthenticated", "true");
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to VrukshaVeda",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
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
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
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

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-center text-muted-foreground">
                Demo credentials: <span className="font-semibold">admin</span> /{" "}
                <span className="font-semibold">admin</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
