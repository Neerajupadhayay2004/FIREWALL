import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Trophy, Medal, Award, AlertTriangle } from "lucide-react";

const FRIENDLY_NAME: Record<string, string> = {
  xss: "XSS Attack",
  sqli: "SQL Injection",
  rce: "Remote Code Exec",
  malware: "Malware",
  dos: "Denial of Service",
  phishing: "Phishing",
  csrf: "CSRF",
  log4j: "Log4j Exploit",
  "path-traversal": "Path Traversal",
  path_traversal: "Path Traversal",
  "command-injection": "Command Injection",
  command_injection: "Command Injection",
  "week-password-detection": "Weak Password",
  "week_password_detection": "Weak Password",
  weak_password_detection: "Weak Password",
  "anomaly-traffic-detection": "Anomaly Traffic",
  anomaly_traffic_detection: "Anomaly Traffic",
  "cloud-server-anomly-detection": "Cloud Anomaly",
  cloud_server_anomly_detection: "Cloud Anomaly",
  "firewall-management": "Firewall Events",
  firewall_management: "Firewall Events",
  "honeypot-detection": "Honeypot Triggers",
  honeypot_detection: "Honeypot Triggers",
};

function prettyName(raw: string) {
  if (FRIENDLY_NAME[raw]) return FRIENDLY_NAME[raw];
  if (FRIENDLY_NAME[raw.toLowerCase()]) return FRIENDLY_NAME[raw.toLowerCase()];
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />;
    case 2:
      return <Medal className="w-4 h-4 text-slate-300 shrink-0" />;
    case 3:
      return <Award className="w-4 h-4 text-amber-600 shrink-0" />;
    default:
      return <span className="w-4 h-4 inline-flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{rank}</span>;
  }
}

function getSeverityColor(name: string, percent: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("xss") || lower.includes("sqli") || lower.includes("rce") || lower.includes("malware") || lower.includes("log4j") || lower.includes("command injection") || lower.includes("command-injection")) {
    return "bg-gradient-to-r from-destructive to-red-400";
  }
  if (lower.includes("dos") || lower.includes("phishing") || lower.includes("csrf") || lower.includes("path")) {
    return "bg-gradient-to-r from-warning to-orange-400";
  }
  if (lower.includes("anomaly") || lower.includes("cloud") || lower.includes("honeypot")) {
    return "bg-gradient-to-r from-accent to-cyan-400";
  }
  return "bg-gradient-to-r from-primary to-sky-400";
}

const TOP_N = 7;

const AttackDistribution = ({ data }: any) => {
  const all = Object.entries(data.attack_categories)
    .map(([type, attacks]: any) => ({
      key: type,
      name: prettyName(type),
      count: Object.keys(attacks).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const total = all.reduce((s, i) => s + i.count, 0) || 1;
  const top = all.slice(0, TOP_N);
  const rest = all.slice(TOP_N);
  const restCount = rest.reduce((s, i) => s + i.count, 0);

  const displayList = [
    ...top.map((i) => ({ ...i, percent: (i.count / total) * 100 })),
    ...(restCount > 0
      ? [{ key: "others", name: "Other Categories", count: restCount, percent: (restCount / total) * 100 }]
      : []),
  ];

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <CardTitle className="text-foreground text-lg">Top Attack Categories</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {total} total · {all.length} types
        </span>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {displayList.map((entry, idx) => {
          const rank = idx + 1;
          const isOther = entry.key === "others";
          return (
            <div key={entry.key} className="group">
              <div className="flex items-center gap-2.5 mb-1.5">
                {getRankIcon(rank)}
                <span className={`text-sm font-medium truncate ${isOther ? "text-muted-foreground" : "text-foreground"}`}>
                  {entry.name}
                </span>
                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {entry.count}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {entry.percent.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden ml-6">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isOther ? "bg-muted-foreground/40" : getSeverityColor(entry.name, entry.percent)
                  }`}
                  style={{ width: `${Math.min(entry.percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
        {displayList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No attack data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttackDistribution;
