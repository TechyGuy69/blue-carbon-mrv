-- Blue Carbon Registry and MRV System Database Schema

-- Create enums for project status and user roles
CREATE TYPE public.project_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'completed');
CREATE TYPE public.user_role AS ENUM ('admin', 'ngo', 'community', 'public');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.credit_status AS ENUM ('issued', 'transferred', 'retired');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  organization TEXT,
  role user_role NOT NULL DEFAULT 'public',
  contact_email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blue carbon projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location JSONB NOT NULL, -- {lat, lng, address, region}
  project_type TEXT NOT NULL, -- mangrove, seagrass, saltmarsh
  area_hectares DECIMAL(10,2) NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  status project_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  baseline_carbon DECIMAL(12,2), -- tonnes CO2
  projected_sequestration DECIMAL(12,2), -- tonnes CO2 over project lifetime
  blockchain_hash TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MRV data submissions
CREATE TABLE public.mrv_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submission_date DATE NOT NULL,
  data_source TEXT NOT NULL, -- csv, excel, drone, sensor
  file_path TEXT,
  data_summary JSONB, -- summary statistics
  carbon_measurement DECIMAL(12,2), -- measured carbon in tonnes
  biomass_data JSONB, -- detailed biomass measurements
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  blockchain_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Carbon credits
CREATE TABLE public.carbon_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  credit_amount DECIMAL(12,2) NOT NULL, -- tonnes CO2
  issue_date DATE NOT NULL,
  vintage_year INTEGER NOT NULL,
  status credit_status NOT NULL DEFAULT 'issued',
  current_owner_id UUID NOT NULL REFERENCES auth.users(id),
  serial_number TEXT NOT NULL UNIQUE,
  blockchain_transaction_hash TEXT,
  retired_date DATE,
  retirement_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Credit transactions
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES public.carbon_credits(id),
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  transaction_type TEXT NOT NULL, -- issue, transfer, retire
  amount DECIMAL(12,2) NOT NULL,
  price_per_credit DECIMAL(10,2),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blockchain_hash TEXT NOT NULL,
  notes TEXT
);

-- AI predictions and analytics
CREATE TABLE public.ai_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  prediction_type TEXT NOT NULL, -- sequestration_forecast, risk_assessment, growth_prediction
  prediction_data JSONB NOT NULL, -- model results and confidence scores
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrv_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update their projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for MRV submissions
CREATE POLICY "MRV submissions viewable by project stakeholders" ON public.mrv_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Project owners can submit MRV data" ON public.mrv_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- RLS Policies for carbon credits
CREATE POLICY "Carbon credits are viewable by everyone" ON public.carbon_credits FOR SELECT USING (true);
CREATE POLICY "Admins can issue credits" ON public.carbon_credits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for transactions
CREATE POLICY "Transactions viewable by involved parties and admins" ON public.credit_transactions FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for AI predictions
CREATE POLICY "AI predictions viewable by project stakeholders" ON public.ai_predictions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')))
);

-- Create indexes for performance
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_mrv_project ON public.mrv_submissions(project_id);
CREATE INDEX idx_credits_project ON public.carbon_credits(project_id);
CREATE INDEX idx_credits_owner ON public.carbon_credits(current_owner_id);
CREATE INDEX idx_transactions_credit ON public.credit_transactions(credit_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, contact_email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    NEW.email,
    'public'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('mrv-data', 'mrv-data', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Storage policies
CREATE POLICY "Users can upload MRV data files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'mrv-data' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their MRV data files" ON storage.objects FOR SELECT USING (
  bucket_id = 'mrv-data' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload project documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Project documents are viewable by project stakeholders" ON storage.objects FOR SELECT USING (
  bucket_id = 'project-documents'
);