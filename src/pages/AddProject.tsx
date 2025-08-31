import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  MapPin, 
  TreePine, 
  Waves, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AddProject = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectType: "",
    location: {
      latitude: "",
      longitude: "",
      address: ""
    },
    areaHectares: "",
    projectedSequestration: "",
    startDate: "",
    endDate: "",
    baselineCarbon: "",
    metadata: {}
  });

  const projectTypes = [
    { value: "mangrove_restoration", label: "Mangrove Restoration", icon: TreePine },
    { value: "seagrass_restoration", label: "Seagrass Restoration", icon: Waves },
    { value: "salt_marsh_restoration", label: "Salt Marsh Restoration", icon: MapPin },
    { value: "coastal_wetland_protection", label: "Coastal Wetland Protection", icon: TreePine },
  ];

  const onDrop = (acceptedFiles) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    toast({
      title: "Files uploaded",
      description: `${acceptedFiles.length} file(s) added successfully`,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const generateBlockchainHash = () => {
    // Simulate blockchain hash generation
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  };

  const uploadFilesToStorage = async (files) => {
    const uploadedFileUrls = [];
    
    for (const file of files) {
      try {
        const fileName = `${user?.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('project-documents')
          .upload(fileName, file);

        if (error) throw error;
        
        uploadedFileUrls.push({
          name: file.name,
          path: data.path,
          size: file.size,
          type: file.type
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    return uploadedFileUrls;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.name || !formData.projectType || !formData.areaHectares) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Upload files to storage
      const fileUrls = await uploadFilesToStorage(uploadedFiles);

      // Generate blockchain hash for verification
      const blockchainHash = generateBlockchainHash();

      // Create location JSON
      const locationData = {
        latitude: parseFloat(formData.location.latitude) || null,
        longitude: parseFloat(formData.location.longitude) || null,
        address: formData.location.address || null
      };

      // Create project in database
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description,
          project_type: formData.projectType,
          location: locationData,
          area_hectares: parseFloat(formData.areaHectares),
          projected_sequestration: parseFloat(formData.projectedSequestration) || null,
          baseline_carbon: parseFloat(formData.baselineCarbon) || null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          owner_id: user?.id,
          status: 'submitted',
          blockchain_hash: blockchainHash
        })
        .select()
        .single();

      if (error) throw error;

      // Store file metadata
      if (fileUrls.length > 0) {
        await supabase
          .from('mrv_submissions')
          .insert({
            project_id: data.id,
            submission_date: new Date().toISOString().split('T')[0],
            data_source: 'file_upload',
            file_path: JSON.stringify(fileUrls),
            data_summary: { files: fileUrls.length, total_size: uploadedFiles.reduce((sum, f) => sum + f.size, 0) },
            verification_status: 'pending'
          });
      }

      toast({
        title: "Success!",
        description: "Project submitted successfully for review",
      });

      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your blue carbon project"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="projectType">Project Type *</Label>
              <Select value={formData.projectType} onValueChange={(value) => updateFormData('projectType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="areaHectares">Area (Hectares) *</Label>
                <Input
                  id="areaHectares"
                  type="number"
                  value={formData.areaHectares}
                  onChange={(e) => updateFormData('areaHectares', e.target.value)}
                  placeholder="Project area"
                  required
                />
              </div>
              <div>
                <Label htmlFor="projectedSequestration">Projected CO₂ Sequestration (tonnes)</Label>
                <Input
                  id="projectedSequestration"
                  type="number"
                  value={formData.projectedSequestration}
                  onChange={(e) => updateFormData('projectedSequestration', e.target.value)}
                  placeholder="Expected CO₂ capture"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Project Location</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Input
                    placeholder="Latitude"
                    value={formData.location.latitude}
                    onChange={(e) => updateFormData('location.latitude', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Longitude"
                    value={formData.location.longitude}
                    onChange={(e) => updateFormData('location.longitude', e.target.value)}
                  />
                </div>
              </div>
              <Input
                className="mt-2"
                placeholder="Address or location description"
                value={formData.location.address}
                onChange={(e) => updateFormData('location.address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Project Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Expected End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="baselineCarbon">Baseline Carbon (tonnes CO₂)</Label>
              <Input
                id="baselineCarbon"
                type="number"
                value={formData.baselineCarbon}
                onChange={(e) => updateFormData('baselineCarbon', e.target.value)}
                placeholder="Current carbon storage"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Upload Project Documents</Label>
              <div
                {...getRootProps()}
                className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-carbon bg-blue-carbon/5' : 'border-muted-foreground/25 hover:border-blue-carbon/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-blue-carbon">Drop files here...</p>
                ) : (
                  <div>
                    <p className="text-muted-foreground mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports CSV, Excel, JSON, PDF, and images
                    </p>
                  </div>
                )}
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div>
                <Label>Uploaded Files</Label>
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Project</h1>
          <p className="text-muted-foreground">
            Submit your blue carbon restoration project for verification
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= stepNumber
                  ? 'bg-blue-carbon text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step > stepNumber ? 'bg-blue-carbon' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Project Details"}
            {step === 2 && "Location & Timeline"}
            {step === 3 && "Documentation"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Basic information about your blue carbon project"}
            {step === 2 && "Project location and timeline information"}
            {step === 3 && "Upload supporting documents and data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Project'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-carbon" />
            Submission Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-success-green mt-0.5" />
              <p>Your project will be reviewed by NCCR experts for scientific accuracy</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-success-green mt-0.5" />
              <p>Blockchain verification ensures data integrity and transparency</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-success-green mt-0.5" />
              <p>Upon approval, your project will be eligible for carbon credit issuance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProject;