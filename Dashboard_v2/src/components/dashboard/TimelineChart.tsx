import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TimelineChart = ({ data }: any) => {
  // Create timeline data from attacks
  const timelineData: any[] = [];
  const dateMap = new Map();

  Object.values(data.attack_categories).forEach((category: any) => {
    Object.values(category).forEach((attack: any) => {
      if (attack.Attack_Time) {
        const date = new Date(attack.Attack_Time).toLocaleDateString();
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
  });

  dateMap.forEach((count, date) => {
    timelineData.push({ date, attacks: count });
  });

  timelineData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Attack Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--primary))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="attacks" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
