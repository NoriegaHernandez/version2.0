-- Update RLS policies to allow public access for internal system
-- This enables the system to work without authentication requirements

-- Drop existing policies and create new ones that allow both authenticated and anon access

-- Majors table
DROP POLICY IF EXISTS "Authenticated users can view majors" ON majors;
DROP POLICY IF EXISTS "Authenticated users can insert majors" ON majors;
DROP POLICY IF EXISTS "Authenticated users can update majors" ON majors;
DROP POLICY IF EXISTS "Authenticated users can delete majors" ON majors;

CREATE POLICY "Allow all access to majors"
  ON majors FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Subjects table
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can insert subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can update subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can delete subjects" ON subjects;

CREATE POLICY "Allow all access to subjects"
  ON subjects FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Students table
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;

CREATE POLICY "Allow all access to students"
  ON students FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Student subject records table
DROP POLICY IF EXISTS "Authenticated users can view records" ON student_subject_records;
DROP POLICY IF EXISTS "Authenticated users can insert records" ON student_subject_records;
DROP POLICY IF EXISTS "Authenticated users can update records" ON student_subject_records;
DROP POLICY IF EXISTS "Authenticated users can delete records" ON student_subject_records;

CREATE POLICY "Allow all access to student_subject_records"
  ON student_subject_records FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Risk factor categories table
DROP POLICY IF EXISTS "Authenticated users can view risk categories" ON risk_factor_categories;
DROP POLICY IF EXISTS "Authenticated users can insert risk categories" ON risk_factor_categories;
DROP POLICY IF EXISTS "Authenticated users can update risk categories" ON risk_factor_categories;
DROP POLICY IF EXISTS "Authenticated users can delete risk categories" ON risk_factor_categories;

CREATE POLICY "Allow all access to risk_factor_categories"
  ON risk_factor_categories FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Risk factors table
DROP POLICY IF EXISTS "Authenticated users can view risk factors" ON risk_factors;
DROP POLICY IF EXISTS "Authenticated users can insert risk factors" ON risk_factors;
DROP POLICY IF EXISTS "Authenticated users can update risk factors" ON risk_factors;
DROP POLICY IF EXISTS "Authenticated users can delete risk factors" ON risk_factors;

CREATE POLICY "Allow all access to risk_factors"
  ON risk_factors FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Student risk factors table
DROP POLICY IF EXISTS "Authenticated users can view student risk factors" ON student_risk_factors;
DROP POLICY IF EXISTS "Authenticated users can insert student risk factors" ON student_risk_factors;
DROP POLICY IF EXISTS "Authenticated users can update student risk factors" ON student_risk_factors;
DROP POLICY IF EXISTS "Authenticated users can delete student risk factors" ON student_risk_factors;

CREATE POLICY "Allow all access to student_risk_factors"
  ON student_risk_factors FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Analysis reports table
DROP POLICY IF EXISTS "Authenticated users can view reports" ON analysis_reports;
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON analysis_reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON analysis_reports;
DROP POLICY IF EXISTS "Authenticated users can delete reports" ON analysis_reports;

CREATE POLICY "Allow all access to analysis_reports"
  ON analysis_reports FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);