import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Activity, AlertTriangle, CheckCircle, Database, LogOut, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/dashboard/StatsCard";
import AttackChart from "@/components/dashboard/AttackChart";
import RecentAttacks from "@/components/dashboard/RecentAttacks";
import AttackDistribution from "@/components/dashboard/AttackDistribution";
import TimelineChart from "@/components/dashboard/TimelineChart";
import BlockedIPsTable from "@/components/dashboard/BlockedIPsTable";
import TrendAnalysis from "@/components/dashboard/TrendAnalysis";
import GeographicInsights from "@/components/dashboard/GeographicInsights";

const POLL_INTERVAL = 2500;
const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://firewall-qaxw.onrender.com").replace(/\/$/, "");
const DATABASE_URL = `${API_BASE_URL}/database.json`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${DATABASE_URL}?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);

      const jsonData = await res.json();
      if (!jsonData || typeof jsonData !== "object" || !jsonData.attack_categories) {
        throw new Error("Invalid firewall database response");
      }

      setData(jsonData);
      setLastUpdated(new Date());
      setIsLive(true);
    } catch (err) {
      console.error("Error loading live firewall database:", err);
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [navigate, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading live firewall data...</p>
          <p className="text-xs text-muted-foreground">{DATABASE_URL}</p>
        </div>
      </div>
    );
  }

  const totalAttacks = Object.values(data.attack_categories || {}).reduce((sum: number, category: any) => {
    return sum + Object.keys(category || {}).length;
  }, 0);

  const blockedIPs = Object.keys(data.worked || {}).length;

  const attackTypes = Object.entries(data.attack_categories || {})
    .filter(([_, attacks]: any) => Object.keys(attacks || {}).length > 0)
    .length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-primary cyber-glow" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CyberShield Dashboard
            </h1>
            <Badge
              variant="outline"
              className={`ml-2 gap-1.5 px-2.5 py-1 text-xs border-0 ${
                isLive
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              }`}
            >
              {isLive ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  LIVE
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  OFFLINE
                </>
              )}
            </Badge>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground ml-1">
                · {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Real-time threat monitoring and analytics</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/blockchain")} className="border-primary/30">
            <Database className="w-4 h-4 mr-2" />
            Blockchain
          </Button>
          <Button variant="outline" onClick={() => navigate("/simulator")} className="border-primary/30">
            Attack Simulator
          </Button>
          <Button variant="outline" onClick={() => navigate("/learning")} className="border-primary/30">
            Learning Hub
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Attacks Detected" value={totalAttacks.toString()} icon={AlertTriangle} trend="Live" trendUp={true} color="destructive" />
        <StatsCard title="Blocked IPs" value={blockedIPs.toString()} icon={Shield} trend="Live" trendUp={false} color="success" />
        <StatsCard title="Attack Types" value={attackTypes.toString()} icon={Activity} trend="Active" color="warning" />
        <StatsCard title="Blockchain Records" value={totalAttacks.toString()} icon={Database} trend="Verified" color="primary" />
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttackChart data={data} />
            <AttackDistribution data={data} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentAttacks data={data} />
            <BlockedIPsTable data={data} />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6"><TrendAnalysis data={data} /></TabsContent>
        <TabsContent value="geographic" className="mt-6"><GeographicInsights data={data} /></TabsContent>
        <TabsContent value="timeline" className="mt-6"><TimelineChart data={data} /></TabsContent>
      </Tabs>

      <div className="cyber-border rounded-lg p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Blockchain Verification</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Records</p>
            <p className="text-2xl font-bold text-primary">{totalAttacks}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Chain Status</p>
            <p className="text-2xl font-bold text-success flex items-center gap-2"><CheckCircle className="w-5 h-5" />Verified</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Data Source</p>
            <p className="text-sm font-mono text-foreground break-all">{API_BASE_URL}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
