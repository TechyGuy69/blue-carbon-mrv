import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Search, MapPin, Calendar, TreePine, Waves, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PublicExplorer = () => {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const chartData = [
    { month: 'Jan', projects: 12, credits: 2400 },
    { month: 'Feb', projects: 15, credits: 3200 },
    { month: 'Mar', projects: 18, credits: 4100 },
    { month: 'Apr', projects: 22, credits: 5300 },
    { month: 'May', projects: 28, credits: 6800 },
    { month: 'Jun', projects: 35, credits: 8900 },
  ];

  const ecosystemData = [
    { type: 'Mangrove', count: 45, color: '#16a34a' },
    { type: 'Seagrass', count: 32, color: '#0891b2' },
    { type: 'Salt Marsh', count: 28, color: '#0f766e' },
  ];

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      setLoading(true);
      
      // Load verified projects (public data)
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          id, name, description, project_type, location, area_hectares, 
          projected_sequestration, status, created_at
        `)
        .eq('status', 'approved');

      // Load carbon credits transactions
      const { data: creditsData } = await supabase
        .from('carbon_credits')
        .select(`
          id, serial_number, credit_amount, vintage_year, 
          status, issue_date, created_at
        `);

      // Load credit transactions
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select(`
          id, transaction_type, amount, transaction_date, 
          blockchain_hash
        `)
        .order('transaction_date', { ascending: false });

      setProjects(projectsData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error loading public data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const getProjectTypeIcon = (type: string) => {
    if (type?.toLowerCase().includes('mangrove')) return <TreePine className="h-4 w-4" />;
    if (type?.toLowerCase().includes('seagrass')) return <Waves className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success-green';
      case 'active': return 'bg-blue-carbon';
      case 'issued': return 'bg-success-green';
      case 'retired': return 'bg-muted';
      default: return 'bg-warning-amber';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-carbon mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading public data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-carbon/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Waves className="h-8 w-8 text-blue-carbon" />
            <TreePine className="h-8 w-8 text-mangrove-green" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Blue Carbon Public Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore verified blue carbon projects and carbon credit transactions on the blockchain
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">Verified restoration projects</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Area</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + (p.area_hectares || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Hectares under restoration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Issued</CardTitle>
              <Waves className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">Carbon credit transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CO₂ Sequestered</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + (p.projected_sequestration || 0), 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Tons CO₂ equivalent</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>Projects and credits over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projects" stroke="hsl(var(--blue-carbon))" strokeWidth={2} />
                  <Line type="monotone" dataKey="credits" stroke="hsl(var(--mangrove-green))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ecosystem Types</CardTitle>
              <CardDescription>Distribution of project types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ecosystemData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--blue-carbon))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verified Projects</CardTitle>
            <CardDescription>Browse all verified blue carbon restoration projects</CardDescription>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>CO₂ Sequestration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getProjectTypeIcon(project.project_type)}
                        <span className="text-sm">{project.project_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{(project.area_hectares || 0).toLocaleString()}</TableCell>
                    <TableCell>{(project.projected_sequestration || 0).toFixed(1)} tCO₂</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest carbon credit transactions on the blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Blockchain Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant="outline">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicExplorer;