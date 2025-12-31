-- =====================================================
-- Change Requests Table for Contractor Edit Approvals
-- Run this SQL in Supabase Dashboard SQL Editor
-- =====================================================

-- Create change_requests table
CREATE TABLE IF NOT EXISTS change_requests (
    id BIGSERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    phase_name TEXT,
    field_name TEXT NOT NULL,
    field_label TEXT,
    old_value TEXT,
    new_value TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_by_role TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_site_id ON change_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_requested_by ON change_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_change_requests_requested_at ON change_requests(requested_at DESC);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_change_requests_updated_at ON change_requests;
CREATE TRIGGER update_change_requests_updated_at
    BEFORE UPDATE ON change_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view all change requests
CREATE POLICY "Allow authenticated users to view change_requests"
ON change_requests FOR SELECT
TO authenticated
USING (true);

-- Policy: Anyone authenticated can insert change requests
CREATE POLICY "Allow authenticated users to insert change_requests"
ON change_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Anyone authenticated can update change requests
CREATE POLICY "Allow authenticated users to update change_requests"
ON change_requests FOR UPDATE
TO authenticated
USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE change_requests;

-- Comments
COMMENT ON TABLE change_requests IS 'Stores change requests from contractors awaiting admin approval';
COMMENT ON COLUMN change_requests.site_id IS 'References sites.site_id';
COMMENT ON COLUMN change_requests.phase_name IS 'References sites.phase_name for composite key';
COMMENT ON COLUMN change_requests.field_name IS 'Database column name being changed';
COMMENT ON COLUMN change_requests.field_label IS 'Human-readable field name for display';
COMMENT ON COLUMN change_requests.status IS 'pending = awaiting review, approved = change applied, rejected = change denied';
