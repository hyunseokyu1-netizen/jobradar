-- Hyunseok Yu 프로파일 삽입
-- Supabase SQL Editor에서 실행 (service role 권한)

-- 1. auth 유저 생성
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  'hyunseok.yu1@gmail.com',
  crypt('JobRadar2026!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- 2. 프로파일 업데이트 (트리거가 자동 생성한 row에 데이터 채우기)
UPDATE profiles
SET
  name              = 'Hyunseok Yu',
  skills            = ARRAY[
    'Node.js', 'Java', 'PHP', 'Laravel',
    'TypeScript', 'JavaScript', 'Angular', 'React Native', 'Next.js',
    'MySQL', 'Oracle', 'MongoDB',
    'AWS', 'GCP', 'IDC/서버운영', 'WAS 서버 관리',
    'Git', 'Jira', 'Figma', 'Supabase', 'Vercel', 'Expo',
    'Claude API', 'Claude Code', 'Prompt Engineering'
  ],
  desired_positions = ARRAY[
    'React Native developer',
    'Fullstack developer',
    'Node.js developer',
    'Backend developer'
  ],
  desired_sources   = ARRAY['indeed', 'seek'],
  desired_locations = ARRAY['Sydney NSW', 'Melbourne VIC', 'Auckland'],
  career_summary    = '10+ years backend/fullstack experience. Node.js, Java, PHP/Laravel. Currently learning React Native and Next.js. Domain experience in IoT healthcare, music content management, payment systems, and international music distribution.',
  preferences       = '{"salary_min": 90000, "salary_max": 150000}'::jsonb
WHERE email = 'hyunseok.yu1@gmail.com';
