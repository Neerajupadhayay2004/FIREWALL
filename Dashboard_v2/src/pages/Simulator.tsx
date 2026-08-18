import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, AlertCircle, Code, Database, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const attackTypes = [
  {
    id: "xss",
    name: "Cross-Site Scripting (XSS)",
    description: "Inject malicious scripts into web pages viewed by other users",
    example: "<script>alert('XSS Attack')</script>",
    difficulty: "Beginner"
  },
  {
    id: "sqli",
    name: "SQL Injection",
    description: "Manipulate database queries to access unauthorized data",
    example: "' OR '1'='1' --",
    difficulty: "Intermediate"
  },
  {
    id: "csrf",
    name: "Cross-Site Request Forgery",
    description: "Force users to execute unwanted actions on authenticated sessions",
    example: "<img src='http://bank.com/transfer?to=attacker&amount=1000'>",
    difficulty: "Intermediate"
  },
  {
    id: "path_traversal",
    name: "Path Traversal",
    description: "Access files and directories outside the web root folder",
    example: "../../../../etc/passwd",
    difficulty: "Beginner"
  },
  {
    id: "command_injection",
    name: "Command Injection",
    description: "Execute arbitrary commands on the host operating system",
    example: "; rm -rf / #",
    difficulty: "Advanced"
  },
  {
    id: "dos",
    name: "Denial of Service",
    description: "Overwhelm a system with traffic to make it unavailable",
    example: "Send 10000 requests per second",
    difficulty: "Advanced"
  }
];

const Simulator = () => {
  const navigate = useNavigate();
  const [selectedAttack, setSelectedAttack] = useState(attackTypes[0]);
  const [payload, setPayload] = useState(attackTypes[0].example);
  const [result, setResult] = useState("");

  const handleSimulate = () => {
    setResult("");
    toast.info("Simulating attack...");
    
    setTimeout(() => {
      const blocked = Math.random() > 0.3; // 70% chance of being blocked
      
      if (blocked) {
        setResult(`🛡️ BLOCKED!\n\nAttack Type: ${selectedAttack.name}\nPayload: ${payload}\n\nThe firewall successfully detected and blocked this ${selectedAttack.name} attempt.\n\nDetection Rules Triggered:\n- Pattern matching\n- Behavior analysis\n- Signature detection\n\nAction Taken: IP temporarily blocked, incident logged to blockchain.`);
        toast.success("Attack blocked successfully!");
      } else {
        setResult(`⚠️ ATTACK SIMULATED\n\nAttack Type: ${selectedAttack.name}\nPayload: ${payload}\n\nIn a real scenario, this attack might have succeeded. This demonstrates the importance of:\n- Regular security updates\n- Input validation\n- Proper authentication\n- Security monitoring`);
        toast.warning("Attack simulated - Learn from this!");
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard")}
          className="mb-6 border-primary/30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Attack Simulator
          </h1>
          <p className="text-muted-foreground">
            Practice cybersecurity attacks in a safe, controlled environment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attack Selection */}
          <div className="lg:col-span-1">
            <Card className="cyber-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Select Attack Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attackTypes.map((attack) => (
                  <button
                    key={attack.id}
                    onClick={() => {
                      setSelectedAttack(attack);
                      setPayload(attack.example);
                      setResult("");
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedAttack.id === attack.id
                        ? 'border-primary bg-primary/10 cyber-glow'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-foreground text-sm">{attack.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{attack.difficulty}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Simulator Interface */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="cyber-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Code className="w-5 h-5 text-primary" />
                  {selectedAttack.name}
                </CardTitle>
                <CardDescription>{selectedAttack.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Attack Payload
                  </label>
                  <Textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="font-mono text-sm bg-input border-primary/30 min-h-[100px]"
                    placeholder="Enter your attack payload..."
                  />
                </div>
                <Button 
                  onClick={handleSimulate}
                  className="w-full bg-primary hover:bg-primary/90 cyber-glow"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card className="cyber-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    Simulation Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-muted/50 p-4 rounded-lg">
                    {result}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Learning Tips */}
            <Card className="cyber-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5 text-success" />
                  Protection Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Always validate and sanitize user input
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use parameterized queries to prevent SQL injection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Implement Content Security Policy (CSP) headers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use HTTPS and secure cookies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Keep software and dependencies updated
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
