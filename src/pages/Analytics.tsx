import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from "recharts";
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  AlertTriangle,
  Target,
  Lightbulb,
  RefreshCw
} from "lucide-react";

const Analytics = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [predictions, setPredictions] = useState([]);

  const sequestrationForecast = [
    { year: '2024', actual: 245, predicted: 245, confidence: 95 },
    { year: '2025', actual: null, predicted: 312, confidence: 88 },
    { year: '2026', actual: null, predicted: 398, confidence: 82 },
    { year: '2027', actual: null, predicted: 467, confidence: 75 },
    { year: '2028', actual: null, predicted: 523, confidence: 68 },
    { year: '2029', actual: null, predicted: 578, confidence: 61 },
    { year: '2030', actual: null, predicted: 634, confidence: 54 }
  ];

  const riskAssessment = [
    { factor: 'Climate Change', risk: 65, mitigation: 78 },
    { factor: 'Sea Level Rise', risk: 45, mitigation: 82 },
    { factor: 'Human Activity', risk: 72, mitigation: 65 },
    { factor: 'Pollution', risk: 38, mitigation: 88 },
    { factor: 'Natural Disasters', risk: 55, mitigation: 45 }
  ];

  const ecosystemHealth = [
    { month: 'Jan', biodiversity: 78, water_quality: 82, carbon_density: 85 },
    { month: 'Feb', biodiversity: 81, water_quality: 79, carbon_density: 87 },
    { month: 'Mar', biodiversity: 83, water_quality: 85, carbon_density: 89 },
    { month: 'Apr', biodiversity: 85, water_quality: 88, carbon_density: 91 },
    { month: 'May', biodiversity: 87, water_quality: 86, carbon_density: 93 },
    { month: 'Jun', biodiversity: 89, water_quality: 90, carbon_density: 95 }
  ];

  const generatePredictions = async () => {
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setPredictions([
      {
        type: "Carbon Sequestration Forecast",
        insight: "Based on current growth patterns, carbon sequestration is expected to increase by 28% over the next 5 years.",
        confidence: 87,
        recommendation: "Consider expanding mangrove restoration in the northern sector for optimal carbon capture."
      },
      {
        type: "Risk Assessment",
        insight: "Climate change poses the highest risk to project sustainability at 65% probability.",
        confidence: 92,
        recommendation: "Implement adaptive management strategies and diversify ecosystem types."
      },
      {
        type: "Optimization Opportunity",
        insight: "Seagrass beds show 34% higher carbon density potential than current measurements.",
        confidence: 79,
        recommendation: "Focus monitoring efforts on seagrass areas and consider enhanced restoration techniques."
      }
    ]);
    
    setIsGenerating(false);
  };

  useEffect(() => {
    generatePredictions();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights and predictions for your blue carbon projects
          </p>
        </div>
        <Button onClick={generatePredictions} disabled={isGenerating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Refresh Insights'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Confidence Score
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86%</div>
            <p className="text-xs text-muted-foreground">
              Average prediction accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Growth Prediction
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+28%</div>
            <p className="text-xs text-muted-foreground">
              5-year sequestration increase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Optimization Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92/100</div>
            <p className="text-xs text-muted-foreground">
              Project efficiency rating
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Carbon Sequestration Forecast</CardTitle>
            <CardDescription>
              AI prediction of future carbon capture based on current trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sequestrationForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(var(--blue-carbon))" 
                  fill="hsl(var(--blue-carbon))" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(var(--mangrove-green))" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              AI analysis of threats and mitigation effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskAssessment} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="factor" width={100} />
                <Tooltip />
                <Bar dataKey="risk" fill="hsl(var(--warning-amber))" />
                <Bar dataKey="mitigation" fill="hsl(var(--success-green))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ecosystem Health Trends</CardTitle>
          <CardDescription>
            Multi-parameter ecosystem monitoring and health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={ecosystemHealth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="biodiversity" 
                stroke="hsl(var(--mangrove-green))" 
                strokeWidth={2}
                name="Biodiversity Index"
              />
              <Line 
                type="monotone" 
                dataKey="water_quality" 
                stroke="hsl(var(--blue-carbon))" 
                strokeWidth={2}
                name="Water Quality"
              />
              <Line 
                type="monotone" 
                dataKey="carbon_density" 
                stroke="hsl(var(--ocean-blue))" 
                strokeWidth={2}
                name="Carbon Density"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Recommendations</CardTitle>
          <CardDescription>
            Machine learning-powered analysis and actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-carbon" />
                    <h4 className="font-semibold">{prediction.type}</h4>
                  </div>
                  <Badge variant="outline">
                    {prediction.confidence}% confidence
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {prediction.insight}
                </p>
                
                <div className="bg-muted/50 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-success-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-sm">Recommendation</h5>
                      <p className="text-sm text-muted-foreground">
                        {prediction.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Confidence Level</span>
                    <span>{prediction.confidence}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;