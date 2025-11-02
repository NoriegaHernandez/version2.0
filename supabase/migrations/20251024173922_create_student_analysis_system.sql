-- Student Analysis System for Instituto Tecnológico de Tijuana
-- This migration creates the complete database schema for tracking and analyzing
-- student failure and dropout rates, including risk factors and quality analysis tools.

-- Create majors table (Academic Programs/Careers)
CREATE TABLE IF NOT EXISTS majors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create subjects table (Academic Subjects/Courses)
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  semester integer NOT NULL CHECK (semester > 0),
  major_id uuid REFERENCES majors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  paternal_surname text NOT NULL,
  maternal_surname text NOT NULL,
  major_id uuid REFERENCES majors(id) ON DELETE SET NULL,
  current_semester integer NOT NULL CHECK (current_semester > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_subject_records table (Academic Performance)
CREATE TABLE IF NOT EXISTS student_subject_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester integer NOT NULL CHECK (semester > 0),
  unit1_grade numeric(5,2) CHECK (unit1_grade >= 0 AND unit1_grade <= 100),
  unit2_grade numeric(5,2) CHECK (unit2_grade >= 0 AND unit2_grade <= 100),
  unit3_grade numeric(5,2) CHECK (unit3_grade >= 0 AND unit3_grade <= 100),
  final_grade numeric(5,2) CHECK (final_grade >= 0 AND final_grade <= 100),
  attendance_percentage numeric(5,2) CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'approved', 'failed', 'dropout')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create risk_factor_categories table
CREATE TABLE IF NOT EXISTS risk_factor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create risk_factors table
CREATE TABLE IF NOT EXISTS risk_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES risk_factor_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create student_risk_factors table (Junction table with additional data)
CREATE TABLE IF NOT EXISTS student_risk_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_subject_record_id uuid NOT NULL REFERENCES student_subject_records(id) ON DELETE CASCADE,
  risk_factor_id uuid NOT NULL REFERENCES risk_factors(id) ON DELETE CASCADE,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create analysis_reports table
CREATE TABLE IF NOT EXISTS analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  analysis_type text NOT NULL CHECK (analysis_type IN ('pareto', 'histogram', 'scatter', 'control_chart', 'stratification')),
  filters jsonb DEFAULT '{}'::jsonb,
  results jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_factor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (full access for internal system)
CREATE POLICY "Authenticated users can view majors"
  ON majors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert majors"
  ON majors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update majors"
  ON majors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete majors"
  ON majors FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view records"
  ON student_subject_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert records"
  ON student_subject_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update records"
  ON student_subject_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete records"
  ON student_subject_records FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view risk categories"
  ON risk_factor_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert risk categories"
  ON risk_factor_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update risk categories"
  ON risk_factor_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete risk categories"
  ON risk_factor_categories FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view risk factors"
  ON risk_factors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert risk factors"
  ON risk_factors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update risk factors"
  ON risk_factors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete risk factors"
  ON risk_factors FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view student risk factors"
  ON student_risk_factors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert student risk factors"
  ON student_risk_factors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update student risk factors"
  ON student_risk_factors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete student risk factors"
  ON student_risk_factors FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view reports"
  ON analysis_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert reports"
  ON analysis_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reports"
  ON analysis_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reports"
  ON analysis_reports FOR DELETE
  TO authenticated
  USING (true);

-- Insert default risk factor categories
INSERT INTO risk_factor_categories (name, description) VALUES
  ('Academic', 'Factors related to academic performance and study habits'),
  ('Psychosocial', 'Psychological and social factors affecting student wellbeing'),
  ('Economic', 'Financial factors impacting student ability to continue studies'),
  ('Institutional', 'Factors related to institutional support and resources'),
  ('Technological', 'Technology access and digital literacy issues'),
  ('Contextual', 'External environmental and family context factors')
ON CONFLICT (name) DO NOTHING;