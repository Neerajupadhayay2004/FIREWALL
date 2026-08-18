import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface BlockedIPsTableProps {
  data: any;
}

const BlockedIPsTable = ({ data }: BlockedIPsTableProps) => {
  const blockedIPs = Object.values(data.worked || {}).slice(0, 5) as any[];

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Shield className="w-5 h-5 text-success" />
          Recently Blocked IPs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP Address</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blockedIPs.map((block: any, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-mono text-sm">{block.Blocked_Ip}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-success/50 text-success">
                    {block.Reason_For_Block}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(block.Block_At_Time).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BlockedIPsTable;
