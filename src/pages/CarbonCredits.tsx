import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  TrendingUp, 
  ArrowUpDown, 
  Trash2, 
  Plus,
  Eye,
  Download,
  Calendar,
  DollarSign,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CarbonCredits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [retireReason, setRetireReason] = useState("");
  const [selectedCredit, setSelectedCredit] = useState(null);

  const chartData = [
    { month: 'Jan', issued: 120, transferred: 80, retired: 40 },
    { month: 'Feb', issued: 150, transferred: 100, retired: 50 },
    { month: 'Mar', issued: 180, transferred: 120, retired: 60 },
    { month: 'Apr', issued: 200, transferred: 140, retired: 80 },
    { month: 'May', issued: 220, transferred: 160, retired: 90 },
    { month: 'Jun', issued: 250, transferred: 180, retired: 100 },
  ];

  const portfolioData = [
    { name: 'Active Credits', value: 450, color: '#16a34a' },
    { name: 'Transferred', value: 280, color: '#0891b2' },
    { name: 'Retired', value: 170, color: '#dc2626' },
  ];

  useEffect(() => {
    if (user) {
      loadCreditData();
    }
  }, [user]);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      
      // Load user's carbon credits
      const { data: creditsData } = await supabase
        .from('carbon_credits')
        .select(`
          id, serial_number, credit_amount, vintage_year, status,
          issue_date, retirement_reason, created_at, current_owner_id,
          projects(name, project_type)
        `)
        .eq('current_owner_id', user?.id);

      // Load credit transactions involving this user
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select(`
          id, transaction_type, amount, transaction_date,
          blockchain_hash, from_user_id, to_user_id, notes
        `)
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order('transaction_date', { ascending: false });

      // Load user's projects for reference
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_type, status')
        .eq('owner_id', user?.id);

      setCredits(creditsData || []);
      setTransactions(transactionsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading credit data:', error);
      toast({
        title: "Error",
        description: "Failed to load carbon credits data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCredits = async () => {
    try {
      if (!transferAmount || !transferRecipient || !selectedCredit) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const amount = parseFloat(transferAmount);
      if (amount <= 0 || amount > selectedCredit.credit_amount) {
        toast({
          title: "Invalid Amount",
          description: "Transfer amount must be positive and not exceed available credits",
          variant: "destructive",
        });
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          credit_id: selectedCredit.id,
          transaction_type: 'transfer',
          amount: amount,
          from_user_id: user?.id,
          to_user_id: transferRecipient, // In real app, would resolve from email/ID
          blockchain_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          notes: `Transfer of ${amount} credits`
        });

      if (transactionError) throw transactionError;

      // Update credit ownership (simplified - in reality would handle partial transfers)
      if (amount === selectedCredit.credit_amount) {
        const { error: updateError } = await supabase
          .from('carbon_credits')
          .update({ current_owner_id: transferRecipient })
          .eq('id', selectedCredit.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: `${amount} credits transferred successfully`,
      });

      loadCreditData();
      setTransferAmount("");
      setTransferRecipient("");
      setSelectedCredit(null);
    } catch (error) {
      console.error('Error transferring credits:', error);
      toast({
        title: "Error",
        description: "Failed to transfer credits",
        variant: "destructive",
      });
    }
  };

  const handleRetireCredits = async () => {
    try {
      if (!retireReason || !selectedCredit) {
        toast({
          title: "Validation Error",
          description: "Please provide a retirement reason",
          variant: "destructive",
        });
        return;
      }

      // Update credit status to retired
      const { error: updateError } = await supabase
        .from('carbon_credits')
        .update({
          status: 'retired',
          retirement_reason: retireReason,
          retired_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', selectedCredit.id);

      if (updateError) throw updateError;

      // Create retirement transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          credit_id: selectedCredit.id,
          transaction_type: 'retire',
          amount: selectedCredit.credit_amount,
          from_user_id: user?.id,
          blockchain_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          notes: retireReason
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: "Credits retired successfully",
      });

      loadCreditData();
      setRetireReason("");
      setSelectedCredit(null);
    } catch (error) {
      console.error('Error retiring credits:', error);
      toast({
        title: "Error",
        description: "Failed to retire credits",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-success-green text-white';
      case 'transferred': return 'bg-blue-carbon text-white';
      case 'retired': return 'bg-destructive text-white';
      default: return 'bg-muted';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'issue': return 'bg-success-green text-white';
      case 'transfer': return 'bg-blue-carbon text-white';
      case 'retire': return 'bg-destructive text-white';
      default: return 'bg-muted';
    }
  };

  const totalActiveCredits = credits.filter(c => c.status === 'issued').reduce((sum, c) => sum + c.credit_amount, 0);
  const totalValue = totalActiveCredits * 50; // Assuming $50 per credit

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-carbon mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading carbon credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carbon Credits</h1>
          <p className="text-muted-foreground">
            Manage your carbon credit portfolio and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveCredits}</div>
            <p className="text-xs text-muted-foreground">tCO₂ equivalent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Retired</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {credits.filter(c => c.status === 'retired').reduce((sum, c) => sum + c.credit_amount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Environmental impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Activity</CardTitle>
            <CardDescription>Monthly credit transactions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="issued" stroke="hsl(var(--success-green))" strokeWidth={2} />
                <Line type="monotone" dataKey="transferred" stroke="hsl(var(--blue-carbon))" strokeWidth={2} />
                <Line type="monotone" dataKey="retired" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Distribution</CardTitle>
            <CardDescription>Breakdown of credit status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="credits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credits">My Credits</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Credit Holdings</CardTitle>
              <CardDescription>Your active and retired carbon credits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vintage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {credit.serial_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{credit.projects?.name}</div>
                          <div className="text-sm text-muted-foreground">{credit.projects?.project_type}</div>
                        </div>
                      </TableCell>
                      <TableCell>{credit.credit_amount} tCO₂</TableCell>
                      <TableCell>{credit.vintage_year}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(credit.status)}>
                          {credit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(credit.issue_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {credit.status === 'issued' && (
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCredit(credit)}
                                >
                                  <ArrowUpDown className="h-3 w-3 mr-1" />
                                  Transfer
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Transfer Credits</DialogTitle>
                                  <DialogDescription>
                                    Transfer carbon credits to another user
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="amount">Amount to Transfer</Label>
                                    <Input
                                      id="amount"
                                      type="number"
                                      max={credit.credit_amount}
                                      value={transferAmount}
                                      onChange={(e) => setTransferAmount(e.target.value)}
                                      placeholder="Enter amount"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="recipient">Recipient</Label>
                                    <Input
                                      id="recipient"
                                      value={transferRecipient}
                                      onChange={(e) => setTransferRecipient(e.target.value)}
                                      placeholder="Enter recipient user ID"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleTransferCredits}>
                                    Transfer Credits
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCredit(credit)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Retire
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Retire Credits</DialogTitle>
                                  <DialogDescription>
                                    Permanently retire these carbon credits
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="retire-reason">Retirement Reason</Label>
                                    <Select value={retireReason} onValueChange={setRetireReason}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="voluntary_offset">Voluntary Carbon Offset</SelectItem>
                                        <SelectItem value="compliance_obligation">Compliance Obligation</SelectItem>
                                        <SelectItem value="corporate_neutrality">Corporate Carbon Neutrality</SelectItem>
                                        <SelectItem value="event_offset">Event Carbon Offset</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleRetireCredits} variant="destructive">
                                    Retire Credits
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All carbon credit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Blockchain Hash</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.amount} tCO₂</TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {transaction.blockchain_hash?.substring(0, 16)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.notes}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarbonCredits;