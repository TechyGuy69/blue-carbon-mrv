import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, MapPin, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  area_hectares: number;
  status: string;
  location: any;
  projected_sequestration: number;
  created_at: string;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-green';
      case 'approved': return 'bg-blue-carbon';
      case 'under_review': return 'bg-warning-amber';
      case 'draft': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading projects...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your blue carbon restoration projects
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="capitalize">{project.project_type}</span>
                  <span>•</span>
                  <span>{project.area_hectares} hectares</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>{project.projected_sequestration} tCO₂ projected</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/projects/${project.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/projects/${project.id}/mrv`}>MRV Data</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No projects match your search criteria.' : 'Get started by creating your first blue carbon project.'}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link to="/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;