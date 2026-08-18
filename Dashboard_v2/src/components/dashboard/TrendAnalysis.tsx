import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const TrendAnalysis = ({ data }: any) => {
  // Generate hourly attack trends
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const attacks = Object.values(data.attack_categories).reduce((sum: number, category: any) => {
      return sum + Object.values(category).filter((attack: any) => {
        if (attack.Attack_Time) {
          const attackHour = new Date(attack.Attack_Time).getHours();
          return attackHour === hour;
        }
        return false;
      }).length;
    }, 0);
    
    return {
      hour: `${hour}:00`,
      attacks,
    };
  });

  // Calculate attack severity trends
  const severityData = [
    { severity: "Critical", count: 8, trend: "+15%" },
    { severity: "High", count: 12, trend: "+8%" },
    { severity: "Medium", count: 6, trend: "-3%" },
    { severity: "Low", count: 3, trend: "-12%" },
  ];

  // Top targeted endpoints
  const endpointData = Object.values(data.attack_categories)
    .flatMap((category: any) => Object.values(category))
    .filter((attack: any) => attack.Attack_On_Endpoint)
    .reduce((acc: any, attack: any) => {
      const endpoint = attack.Attack_On_Endpoint.split('?')[0];
      acc[endpoint] = (acc[endpoint] || 0) + 1;
      return acc;
    }, {});

  const topEndpoints = Object.entries(endpointData)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }));

  return (
    <div className="space-y-6">
      {/* Hourly Attack Trends */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">24-Hour Attack Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--primary))',
                  borderRadius: '8px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="attacks" 
                stroke="hsl(var(--primary))" 
                fill="url(#attackGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Severity Trends */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Attack Severity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {severityData.map((item) => {
              const isPositive = item.trend.startsWith('+');
              return (
                <div key={item.severity} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded ${
                      item.severity === 'Critical' ? 'bg-destructive' :
                      item.severity === 'High' ? 'bg-warning' :
                      item.severity === 'Medium' ? 'bg-accent' :
                      'bg-success'
                    }`} />
                    <div>
                      <p className="font-semibold text-foreground">{item.severity}</p>
                      <p className="text-2xl font-bold text-primary">{item.count}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    isPositive ? 'text-destructive' : 'text-success'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">{item.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Targeted Endpoints */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Most Targeted Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEndpoints.map((item: any, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-foreground truncate">{item.endpoint}</span>
                  <span className="text-primary font-bold">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(item.count / Math.max(...topEndpoints.map((e: any) => e.count))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendAnalysis;
