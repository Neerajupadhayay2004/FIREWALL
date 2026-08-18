import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";

const FRIENDLY_NAME: Record<string, string> = {
  xss: "XSS",
  sqli: "SQLi",
  rce: "RCE",
  malware: "Malware",
  dos: "DoS",
  phishing: "Phish",
  csrf: "CSRF",
  log4j: "Log4j",
  "path-traversal": "Path",
  path_traversal: "Path",
  "command-injection": "CmdInj",
  command_injection: "CmdInj",
  "week-password-detection": "WeakPwd",
  "week_password_detection": "WeakPwd",
  weak_password_detection: "WeakPwd",
  "anomaly-traffic-detection": "Anomaly",
  anomaly_traffic_detection: "Anomaly",
  "cloud-server-anomly-detection": "Cloud",
  cloud_server_anomly_detection: "Cloud",
  "firewall-management": "FW",
  firewall_management: "FW",
  "honeypot-detection": "Honey",
  honeypot_detection: "Honey",
};

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function prettyName(raw: string) {
  if (FRIENDLY_NAME[raw]) return FRIENDLY_NAME[raw];
  if (FRIENDLY_NAME[raw.toLowerCase()]) return FRIENDLY_NAME[raw.toLowerCase()];
  const out = raw.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return out.length > 8 ? out.slice(0, 7) + "…" : out;
}

const AttackChart = ({ data }: any) => {
  const chartData = Object.entries(data.attack_categories)
    .map(([type, attacks]: any) => ({
      key: type,
      name: prettyName(type),
      attacks: Object.keys(attacks).length,
    }))
    .filter((item) => item.attacks > 0)
    .sort((a, b) => b.attacks - a.attacks)
    .slice(0, 8);

  const maxVal = Math.max(...chartData.map((d) => d.attacks), 1);
  const totalAttacks = chartData.reduce((s, i) => s + i.attacks, 0);

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="text-foreground text-lg">Attack Frequency</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Top {chartData.length} · {totalAttacks} hits
        </span>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              formatter={(value: number) => [
                `${value} attacks`,
                "Count",
              ]}
              labelFormatter={(l) => {
                const item = chartData.find((d) => d.name === l);
                if (!item) return String(l);
                const pct = ((item.attacks / maxVal) * 100).toFixed(0);
                return `${String(l)} · ${pct}% of max`;
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--primary) / 0.5)",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.15)",
              }}
              labelStyle={{
                color: "hsl(var(--primary))",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            />
            <Bar
              dataKey="attacks"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
              maxBarSize={48}
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AttackChart;
