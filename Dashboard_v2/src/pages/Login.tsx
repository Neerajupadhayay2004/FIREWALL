import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Static credentials
    if (username === "admin" && password === "firewall2024") {
      localStorage.setItem("isAuthenticated", "true");
      toast.success("Login successful! Welcome to CyberShield Dashboard");
      navigate("/dashboard");
    } else {
      toast.error("Invalid credentials. Try: admin / firewall2024");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center cyber-glow">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CyberShield Firewall
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Advanced Threat Detection & Prevention System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-primary/30 focus:border-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-primary/30 focus:border-primary"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cyber-glow">
              <Lock className="w-4 h-4 mr-2" />
              Secure Login
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Demo: admin / firewall2024
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
