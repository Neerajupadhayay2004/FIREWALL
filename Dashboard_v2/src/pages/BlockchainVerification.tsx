import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Database, CheckCircle, XCircle, Search, ArrowLeft, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BlockchainVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }

    fetch("/blockchain_audit.json")
      .then((res) => res.json())
      .then((data) => setBlockchainData(data))
      .catch((err) => console.error("Error loading blockchain data:", err));
  }, [navigate]);

  const handleVerifyIntegrity = async () => {
    if (!transactionHash.trim()) {
      toast({
        title: "Error",
        description: "Please enter a transaction hash",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("http://localhost:3000/VerifyIntegrity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionHash }),
      });

      const result = await response.json();
      setVerificationResult(result);

      toast({
        title: result.success ? "Verification Successful" : "Verification Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify integrity. Please check if the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!blockchainData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="w-16 h-16 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  const totalRecords = blockchainData.records.length;
  const attackTypeDistribution = blockchainData.records.reduce((acc: any, record: any) => {
    acc[record.attackType] = (acc[record.attackType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="mb-4 border-primary/30">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-10 h-10 text-primary cyber-glow" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Blockchain Verification
          </h1>
        </div>
        <p className="text-muted-foreground">Immutable blockchain audit trail and integrity verification</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cyber-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalRecords}</p>
          </CardContent>
        </Card>
        <Card className="cyber-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Blockchain Version</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{blockchainData.metadata.version}</p>
          </CardContent>
        </Card>
        <Card className="cyber-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-foreground">
              {new Date(blockchainData.metadata.created).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Hash Verification */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Verify Transaction Integrity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter transaction hash (e.g., 0xb987a8ef...)"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              className="flex-1 font-mono"
            />
            <Button onClick={handleVerifyIntegrity} disabled={isVerifying}>
              <Search className="w-4 h-4 mr-2" />
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>

          {verificationResult && (
            <div className="space-y-4 mt-6">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border-2 ${
                verificationResult.success 
                  ? 'bg-success/10 border-success' 
                  : 'bg-destructive/10 border-destructive'
              }`}>
                <div className="flex items-center gap-3">
                  {verificationResult.success ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {verificationResult.success ? "Integrity Verified" : "Integrity Check Failed"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{verificationResult.message}</p>
                  </div>
                </div>
              </div>

              {/* Integrity Details */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Integrity Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Local Hash Match:</span>
                    {verificationResult.integrity.localHashMatch ? (
                      <Badge className="bg-success">Verified</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Blockchain Verified:</span>
                    {verificationResult.integrity.blockchainVerified ? (
                      <Badge className="bg-success">Verified</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Overall Integrity:</span>
                    {verificationResult.integrity.overallIntegrity ? (
                      <Badge className="bg-success">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Invalid</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hash Verification */}
              {verificationResult.verification && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Hash Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Stored Hash:</p>
                      <p className="text-xs font-mono bg-background p-2 rounded break-all">
                        {verificationResult.verification.storedHash || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Recalculated Hash:</p>
                      <p className="text-xs font-mono bg-background p-2 rounded break-all">
                        {verificationResult.verification.recalculatedHash || "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">Hashes Match:</span>
                      {verificationResult.verification.hashesMatch ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Local Record */}
              {verificationResult.localRecord && verificationResult.localRecord.type && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Local Record Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-semibold">Type:</div>
                      <div className="font-mono">{verificationResult.localRecord.type}</div>
                      <div className="font-semibold">Attack Type:</div>
                      <div className="font-mono uppercase">{verificationResult.localRecord.attackType}</div>
                      <div className="font-semibold">Attacker IP:</div>
                      <div className="font-mono">{verificationResult.localRecord.attackerIp}</div>
                      <div className="font-semibold">Block Number:</div>
                      <div className="font-mono">{verificationResult.localRecord.blockNumber}</div>
                      <div className="font-semibold">Timestamp:</div>
                      <div className="font-mono">{verificationResult.localRecord.timestamp}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blockchain Data */}
              {verificationResult.blockchainData && verificationResult.blockchainData.hash && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Blockchain Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-semibold">Block Number:</div>
                      <div className="font-mono">{verificationResult.blockchainData.blockNumber}</div>
                      <div className="font-semibold">From:</div>
                      <div className="font-mono text-xs break-all">{verificationResult.blockchainData.from}</div>
                      <div className="font-semibold">To:</div>
                      <div className="font-mono text-xs break-all">{verificationResult.blockchainData.to}</div>
                      <div className="font-semibold">Hash:</div>
                      <div className="font-mono text-xs break-all">{verificationResult.blockchainData.hash}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attack Type Distribution */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm mb-8">
        <CardHeader>
          <CardTitle>Attack Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(attackTypeDistribution).map(([type, count]: any) => (
              <div key={type} className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">{type}</p>
                <p className="text-2xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Records Table */}
      <Card className="cyber-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Blockchain Audit Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block #</TableHead>
                <TableHead>Attack Type</TableHead>
                <TableHead>Attacker IP</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Transaction Hash</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockchainData.records.map((record: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">{record.blockNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {record.attackType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{record.attackerIp}</TableCell>
                  <TableCell className="text-xs font-mono max-w-xs truncate">{record.endpoint}</TableCell>
                  <TableCell className="text-xs font-mono max-w-xs truncate">{record.transactionHash}</TableCell>
                  <TableCell className="text-sm">{new Date(record.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainVerification;
