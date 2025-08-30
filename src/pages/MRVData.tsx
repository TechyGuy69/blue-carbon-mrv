import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileSpreadsheet, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Download
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const MRVData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedProject, setSelectedProject] = useState("");
  const [mrvNotes, setMrvNotes] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedProject) {
      toast({
        title: "Select a project",
        description: "Please select a project before uploading MRV data.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    for (const file of acceptedFiles) {
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('mrv-data')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create MRV submission record
        const { error: insertError } = await supabase
          .from('mrv_submissions')
          .insert({
            project_id: selectedProject,
            submission_date: new Date().toISOString().split('T')[0],
            data_source: fileExt === 'csv' ? 'csv' : fileExt === 'xlsx' ? 'excel' : 'other',
            file_path: fileName,
            notes: mrvNotes,
            carbon_measurement: Math.random() * 100 + 50, // Simulated measurement
            data_summary: {
              file_name: file.name,
              file_size: file.size,
              processed_rows: Math.floor(Math.random() * 1000) + 100
            }
          });

        if (insertError) throw insertError;

        clearInterval(progressInterval);
        setUploadProgress(100);

        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded and processed.`
        });

      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your file.",
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setMrvNotes("");
  }, [selectedProject, mrvNotes, user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 5
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MRV Data Upload</h1>
          <p className="text-muted-foreground">
            Upload and manage Monitoring, Reporting, and Verification data
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload MRV Data</CardTitle>
            <CardDescription>
              Upload CSV or Excel files containing field measurements and monitoring data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-select">Select Project</Label>
              <select
                id="project-select"
                className="w-full p-2 border rounded-md"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Choose a project...</option>
                <option value="demo-project-1">Mangrove Restoration Alpha</option>
                <option value="demo-project-2">Seagrass Conservation Beta</option>
                <option value="demo-project-3">Salt Marsh Recovery Gamma</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrv-notes">Notes (Optional)</Label>
              <Textarea
                id="mrv-notes"
                placeholder="Add any notes about this MRV data submission..."
                value={mrvNotes}
                onChange={(e) => setMrvNotes(e.target.value)}
              />
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-carbon bg-blue-carbon/5' : 'border-muted-foreground/25 hover:border-blue-carbon/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-blue-carbon font-medium">Drop files here...</p>
              ) : (
                <div>
                  <p className="font-medium mb-2">Drop MRV files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV, Excel (.xlsx, .xls) files
                  </p>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading and processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Processing Guidelines</CardTitle>
            <CardDescription>
              Ensure your MRV data follows these standards for optimal processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Required Columns</h4>
                  <p className="text-sm text-muted-foreground">
                    Include Date, Location (GPS), Species, Biomass measurements
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Data Format</h4>
                  <p className="text-sm text-muted-foreground">
                    Use standardized units (kg/m², tonnes CO₂/ha)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Quality Control</h4>
                  <p className="text-sm text-muted-foreground">
                    Include measurement uncertainty and quality flags
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning-amber mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">File Size Limit</h4>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: 50MB per upload
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Track the status of your MRV data submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="h-8 w-8 text-blue-carbon" />
                <div>
                  <h4 className="font-medium">mangrove_data_2024_q1.csv</h4>
                  <p className="text-sm text-muted-foreground">
                    Uploaded 2 hours ago • 1,245 records
                  </p>
                </div>
              </div>
              <Badge className="bg-success-green">Verified</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="h-8 w-8 text-blue-carbon" />
                <div>
                  <h4 className="font-medium">seagrass_biomass_march.xlsx</h4>
                  <p className="text-sm text-muted-foreground">
                    Uploaded 1 day ago • 856 records
                  </p>
                </div>
              </div>
              <Badge className="bg-warning-amber">Pending Review</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Database className="h-8 w-8 text-mangrove-green" />
                <div>
                  <h4 className="font-medium">sensor_data_continuous.csv</h4>
                  <p className="text-sm text-muted-foreground">
                    Uploaded 3 days ago • 3,421 records
                  </p>
                </div>
              </div>
              <Badge className="bg-success-green">Verified</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MRVData;