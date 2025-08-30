import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Leaf, 
  Database, 
  Shield, 
  Plus,
  TreePine,
  Waves,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCredits: 0,
    totalSequestration: 0,
    pendingVerifications: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load projects stats
      const { data: projects } = await supabase
        .from('projects')
        .select('*');
      
      // Load carbon credits stats
      const { data: credits } = await supabase
        .from('carbon_credits')
        .select('credit_amount');

      // Load MRV submissions
      const { data: mrvData } = await supabase
        .from('mrv_submissions')
        .select('*')
        .eq('verification_status', 'pending');

      setStats({
        totalProjects: projects?.length || 0,
        totalCredits: credits?.reduce((sum, credit) => sum + parseFloat(String(credit.credit_amount || '0')), 0) || 0,
        totalSequestration: projects?.reduce((sum, project) => sum + parseFloat(String(project.projected_sequestration || '0')), 0) || 0,
        pendingVerifications: mrvData?.length || 0,
      });

      // Generate mock chart data for demo
      setChartData([
        { month: 'Jan', sequestration: 2400, credits: 1400 },
        { month: 'Feb', sequestration: 1398, credits: 2210 },
        { month: 'Mar', sequestration: 9800, credits: 2290 },
        { month: 'Apr', sequestration: 3908, credits: 2000 },
        { month: 'May', sequestration: 4800, credits: 2181 },
        { month: 'Jun', sequestration: 3800, credits: 2500 },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const projectTypeData = [
    { name: 'Mangrove', value: 45, color: '#16a34a' },
    { name: 'Seagrass', value: 30, color: '#0891b2' },
    { name: 'Salt Marsh', value: 25, color: '#0f766e' },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your blue carbon projects and impact
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active restoration projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Carbon Credits
            </CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              tCO₂ equivalent issued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sequestration
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSequestration.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              tCO₂ projected capture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">
              MRV submissions to review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Carbon Sequestration Trends</CardTitle>
            <CardDescription>
              Monthly carbon sequestration and credit issuance
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sequestration" 
                  stroke="hsl(var(--blue-carbon))" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="credits" 
                  stroke="hsl(var(--mangrove-green))" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Project Types</CardTitle>
            <CardDescription>
              Distribution of blue carbon ecosystems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={projectTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-success-green rounded-full" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">New MRV data submitted</p>
                  <p className="text-xs text-muted-foreground">
                    Mangrove Project Alpha - 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-carbon rounded-full" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Carbon credits issued</p>
                  <p className="text-xs text-muted-foreground">
                    150 tCO₂ credits - 1 day ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-warning-amber rounded-full" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Verification pending</p>
                  <p className="text-xs text-muted-foreground">
                    Seagrass Project Beta - 3 days ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Summary</CardTitle>
            <CardDescription>
              Environmental and economic impact metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Carbon Sequestered</span>
                  <span className="text-sm">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Ecosystem Health</span>
                  <span className="text-sm">88%</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Community Engagement</span>
                  <span className="text-sm">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;