-- ============================================================
-- Migration 020: 체험 후기
-- user_feedback — 유저당 1개 (수정 가능), 별점 + 자유 텍스트 + 공개 동의
-- allow_public=true 인 후기만 추후 랜딩 페이지 후기 섹션에 노출할 수 있다.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content       TEXT NOT NULL DEFAULT '',
  allow_public  BOOLEAN NOT NULL DEFAULT false,  -- 랜딩 등 공개 영역 게재 동의
  display_name  TEXT,                            -- 공개 시 표시할 이름 (예: "현석 · 시드니 취업 준비")
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 서버 액션(service role)에서만 읽고 쓴다 (RLS 켜고 정책 없음)
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
