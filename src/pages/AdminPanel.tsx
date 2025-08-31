import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  AlertTriangle, 
  Users,
  TrendingUp,
  FileText,
  Coins
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [mrvSubmissions, setMrvSubmissions] = useState([]);
  const [carbonCredits, setCarbonCredits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [creditAmount, setCreditAmount] = useState("");

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load pending projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          id, name, description, project_type, area_hectares,
          projected_sequestration, status, created_at, owner_id
        `)
        .in('status', ['submitted', 'under_review']);

      // Load pending MRV submissions
      const { data: mrvData } = await supabase
        .from('mrv_submissions')
        .select(`
          id, project_id, submission_date, data_source,
          carbon_measurement, verification_status, created_at,
          projects(name)
        `)
        .eq('verification_status', 'pending');

      // Load carbon credits
      const { data: creditsData } = await supabase
        .from('carbon_credits')
        .select(`
          id, serial_number, credit_amount, vintage_year,
          status, issue_date, retirement_reason
        `)
        .order('created_at', { ascending: false });

      // Load user profiles
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, contact_email, role, created_at')
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);
      setMrvSubmissions(mrvData || []);
      setCarbonCredits(creditsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectReview = async (projectId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('projects')
        .update({
          status: newStatus,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Project ${action}d successfully`,
      });

      loadAdminData();
      setSelectedItem(null);
      setReviewNotes("");
    } catch (error) {
      console.error('Error reviewing project:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} project`,
        variant: "destructive",
      });
    }
  };

  const handleMrvReview = async (mrvId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      
      const { error } = await supabase
        .from('mrv_submissions')
        .update({
          verification_status: newStatus,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          notes: reviewNotes
        })
        .eq('id', mrvId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `MRV data ${action}d successfully`,
      });

      loadAdminData();
      setSelectedItem(null);
      setReviewNotes("");
    } catch (error) {
      console.error('Error reviewing MRV:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} MRV data`,
        variant: "destructive",
      });
    }
  };

  const handleIssueCredits = async (projectId: string) => {
    try {
      if (!creditAmount || parseFloat(creditAmount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid credit amount",
          variant: "destructive",
        });
        return;
      }

      const serialNumber = `BCC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('carbon_credits')
        .insert({
          project_id: projectId,
          serial_number: serialNumber,
          credit_amount: parseFloat(creditAmount),
          vintage_year: new Date().getFullYear(),
          status: 'issued',
          issue_date: new Date().toISOString().split('T')[0],
          current_owner_id: user?.id,
          blockchain_transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${creditAmount} carbon credits issued successfully`,
      });

      loadAdminData();
      setSelectedItem(null);
      setCreditAmount("");
    } catch (error) {
      console.error('Error issuing credits:', error);
      toast({
        title: "Error",
        description: "Failed to issue carbon credits",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': case 'issued': return 'bg-success-green text-white';
      case 'rejected': case 'retired': return 'bg-destructive text-white';
      case 'pending': case 'under_review': return 'bg-warning-amber text-black';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-carbon mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage projects, verify data, and oversee carbon credit issuance
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-carbon/10 text-blue-carbon border-blue-carbon">
          <Shield className="h-3 w-3 mr-1" />
          NCCR Admin
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'submitted').length + mrvSubmissions.length}
            </div>
            <p className="text-xs text-muted-foreground">Projects & MRV data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Issued</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carbonCredits.filter(c => c.status === 'issued').length}
            </div>
            <p className="text-xs text-muted-foreground">Active carbon credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Approved projects</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Project Reviews</TabsTrigger>
          <TabsTrigger value="mrv">MRV Verification</TabsTrigger>
          <TabsTrigger value="credits">Carbon Credits</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Project Reviews</CardTitle>
              <CardDescription>Review and approve submitted projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Sequestration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{project.project_type}</TableCell>
                      <TableCell>{project.area_hectares} ha</TableCell>
                      <TableCell>{project.projected_sequestration} tCO₂</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedItem(project)}>
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Project: {project.name}</DialogTitle>
                                <DialogDescription>
                                  Review and approve or reject this project submission
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm text-muted-foreground">{project.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Type</Label>
                                    <p className="text-sm">{project.project_type}</p>
                                  </div>
                                  <div>
                                    <Label>Area</Label>
                                    <p className="text-sm">{project.area_hectares} hectares</p>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="notes">Review Notes</Label>
                                  <Textarea
                                    id="notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add review comments..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => handleProjectReview(project.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleProjectReview(project.id, 'approve')}
                                  className="bg-success-green hover:bg-success-green/90"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mrv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MRV Data Verification</CardTitle>
              <CardDescription>Verify monitoring, reporting, and verification data</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Carbon Measurement</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrvSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.projects?.name}</TableCell>
                      <TableCell>{submission.data_source}</TableCell>
                      <TableCell>{submission.carbon_measurement} tCO₂</TableCell>
                      <TableCell>{new Date(submission.submission_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.verification_status)}>
                          {submission.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedItem(submission)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Verify MRV Data</DialogTitle>
                              <DialogDescription>
                                Review and verify this MRV submission
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Data Source</Label>
                                  <p className="text-sm">{submission.data_source}</p>
                                </div>
                                <div>
                                  <Label>Carbon Measurement</Label>
                                  <p className="text-sm">{submission.carbon_measurement} tCO₂</p>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="verification-notes">Verification Notes</Label>
                                <Textarea
                                  id="verification-notes"
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add verification comments..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => handleMrvReview(submission.id, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleMrvReview(submission.id, 'approve')}
                                className="bg-success-green hover:bg-success-green/90"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Credits Management</CardTitle>
              <CardDescription>Issue and manage carbon credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Coins className="h-4 w-4 mr-2" />
                      Issue New Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Issue Carbon Credits</DialogTitle>
                      <DialogDescription>
                        Issue new carbon credits for a verified project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="credit-amount">Credit Amount (tCO₂)</Label>
                        <Input
                          id="credit-amount"
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Enter credit amount..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleIssueCredits('mock-project-id')}>
                        Issue Credits
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vintage Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carbonCredits.slice(0, 10).map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {credit.serial_number}
                        </code>
                      </TableCell>
                      <TableCell>{credit.credit_amount} tCO₂</TableCell>
                      <TableCell>{credit.vintage_year}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(credit.status)}>
                          {credit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(credit.issue_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.contact_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
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

export default AdminPanel;