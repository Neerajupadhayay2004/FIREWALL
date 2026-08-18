import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "destructive" | "success" | "warning";
}

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, color = "primary" }: StatsCardProps) => {
  const colorClasses = {
    primary: "text-primary",
    destructive: "text-destructive",
    success: "text-success",
    warning: "text-warning"
  };

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm p-6 hover:cyber-glow transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-success' : 'text-destructive'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
    </Card>
  );
};

export default StatsCard;
