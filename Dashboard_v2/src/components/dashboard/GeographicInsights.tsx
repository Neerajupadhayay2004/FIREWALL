import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin } from "lucide-react";

const GeographicInsights = ({ data }: any) => {
  // Simulate geographic data based on IP patterns
  const getRegionFromIP = (ip: string) => {
    const first = parseInt(ip.split('.')[0]);
    if (first >= 1 && first <= 126) return "North America";
    if (first >= 128 && first <= 191) return "Europe";
    if (first >= 192 && first <= 223) return "Asia Pacific";
    return "Other";
  };

  const allAttacks = Object.values(data.attack_categories)
    .flatMap((category: any) => Object.values(category))
    .filter((attack: any) => attack.Attacker_Ip || attack.ip_address);

  const regionData = allAttacks.reduce((acc: any, attack: any) => {
    const ip = attack.Attacker_Ip || attack.ip_address;
    const region = getRegionFromIP(ip);
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});

  const regions = Object.entries(regionData)
    .map(([region, count]) => ({ region, count }))
    .sort((a: any, b: any) => b.count - a.count);

  const totalAttacks = regions.reduce((sum: any, r: any) => sum + r.count, 0);

  // Top attacker IPs
  const ipCount = allAttacks.reduce((acc: any, attack: any) => {
    const ip = attack.Attacker_Ip || attack.ip_address;
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {});

  const topIPs = Object.entries(ipCount)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  return (
    <div className="space-y-6">
      {/* Geographic Distribution */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Geographic Attack Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regions.map((item: any) => {
              const percentage = ((item.count / totalAttacks) * 100).toFixed(1);
              return (
                <div key={item.region} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{item.region}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                      <span className="text-primary font-bold">{item.count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Attacker IPs */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Top Attacking IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topIPs.map((item: any, index) => (
              <div 
                key={item.ip} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-destructive">#{index + 1}</span>
                  </div>
                  <span className="font-mono text-sm text-foreground">{item.ip}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Attacks:</span>
                  <span className="text-lg font-bold text-destructive">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attack Origin Stats */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Origin Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Unique IPs</p>
              <p className="text-2xl font-bold text-primary">{Object.keys(ipCount).length}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Attacks</p>
              <p className="text-2xl font-bold text-destructive">{totalAttacks}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg. Attacks/IP</p>
              <p className="text-2xl font-bold text-warning">
                {(totalAttacks / Object.keys(ipCount).length).toFixed(1)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Regions</p>
              <p className="text-2xl font-bold text-accent">{regions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeographicInsights;
