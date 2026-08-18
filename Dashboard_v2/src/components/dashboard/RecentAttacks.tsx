import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const RecentAttacks = ({ data }: any) => {
  const recentAttacks: any[] = [];

  Object.entries(data.attack_categories).forEach(([type, attacks]: any) => {
    Object.entries(attacks).forEach(([id, attack]: any) => {
      recentAttacks.push({
        type,
        ...attack,
      });
    });
  });

  recentAttacks.sort((a, b) => 
    new Date(b.Attack_Time || 0).getTime() - new Date(a.Attack_Time || 0).getTime()
  );

  const displayAttacks = recentAttacks.slice(0, 5);

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Recent Attacks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayAttacks.map((attack, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Badge variant="destructive" className="font-mono text-xs">
                    {attack.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{attack.Attacker_Ip}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {attack.Attack_Time ? new Date(attack.Attack_Time).toLocaleString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentAttacks;
