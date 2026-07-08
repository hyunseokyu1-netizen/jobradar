import StaticPageShell, { PolicySection } from '@/components/matchda/landing/StaticPageShell'

export const dynamic = 'force-dynamic'

export const metadata = { title: '개인정보 처리방침 — MatchDa' }

export default function PrivacyPage() {
  return (
    <StaticPageShell title="개인정보 처리방침" subtitle="시행일: 2026년 7월 4일">
      <PolicySection title="1. 수집하는 개인정보">
        <p>MatchDa(매치다, 이하 &ldquo;회사&rdquo;)는 서비스 제공을 위해 다음 정보를 수집합니다.</p>
        <p>· <b className="text-[#1F2A37]">계정 정보</b>: 이메일 주소, 비밀번호(암호화 저장) 또는 소셜 로그인 식별자</p>
        <p>· <b className="text-[#1F2A37]">프로필 정보</b>: 이름, 전화번호, 희망 직무·지역 등 회원이 입력한 정보</p>
        <p>· <b className="text-[#1F2A37]">이력서 정보</b>: 회원이 업로드하거나 입력한 이력서 내용(경력, 학력, 기술 등)</p>
        <p>· <b className="text-[#1F2A37]">결제 정보</b>: 결제는 Paddle이 처리하며, 회사는 카드번호를 저장하지 않습니다. 구독 상태와 Paddle 고객 식별자만 보관합니다.</p>
        <p>· <b className="text-[#1F2A37]">자동 수집 정보</b>: 접속 기록, 서비스 이용 기록</p>
      </PolicySection>

      <PolicySection title="2. 개인정보의 이용 목적">
        <p>· 회원 식별 및 서비스 제공 (이력서 번역·맞춤화, 공고 매칭, 커버레터 생성)</p>
        <p>· 유료 구독 결제 및 관리</p>
        <p>· 고객 문의 응대 및 공지사항 전달</p>
        <p>· 서비스 개선 및 오류 분석</p>
      </PolicySection>

      <PolicySection title="3. 개인정보의 처리 위탁">
        <p>회사는 서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁합니다.</p>
        <p>· <b className="text-[#1F2A37]">Supabase</b> — 데이터베이스 및 인증 (계정·프로필·이력서 데이터 저장)</p>
        <p>· <b className="text-[#1F2A37]">Anthropic</b> — AI 처리 (이력서 번역·분석·매칭 시 이력서와 공고 내용이 Claude API로 전송됨)</p>
        <p>· <b className="text-[#1F2A37]">Paddle</b> — 결제 처리</p>
        <p>· <b className="text-[#1F2A37]">Vercel</b> — 서비스 호스팅</p>
        <p>· <b className="text-[#1F2A37]">Resend</b> — 이메일 발송</p>
        <p>각 수탁사는 자체 개인정보 보호 정책에 따라 정보를 처리하며, 회사는 위탁 목적 범위 내에서만 정보를 제공합니다.</p>
      </PolicySection>

      <PolicySection title="4. 보유 및 이용 기간">
        <p>· 회원 탈퇴(계정 삭제) 시 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 정보(결제 기록 등)는 해당 법령이 정한 기간 동안 보관합니다.</p>
        <p>· 전자상거래법에 따른 계약·결제 기록: 5년</p>
      </PolicySection>

      <PolicySection title="5. 이용자의 권리">
        <p>회원은 언제든지 다음을 요청할 수 있습니다.</p>
        <p>· 개인정보 열람·수정: 설정 페이지 및 내 이력서 페이지에서 직접 가능</p>
        <p>· 계정 삭제 및 데이터 파기: 고객센터 챗봇 또는 이메일로 요청</p>
        <p>· 데이터 내보내기: 이력서는 PDF·DOCX로 직접 다운로드 가능하며, 전체 데이터 내보내기는 이메일로 요청</p>
      </PolicySection>

      <PolicySection title="6. 개인정보의 안전성 확보 조치">
        <p>· 비밀번호 암호화 저장, 통신 구간 암호화(HTTPS)</p>
        <p>· 데이터베이스 접근 제어(행 수준 보안) 및 최소 권한 원칙</p>
        <p>· 결제 정보 미보관 (Paddle PCI-DSS 준수 환경에서 처리)</p>
      </PolicySection>

      <PolicySection title="7. 문의처">
        <p>
          개인정보 관련 문의: <a href="mailto:support@matchda.com" className="font-medium text-[#046C4E] hover:underline">support@matchda.com</a>
        </p>
        <p>본 방침이 변경되는 경우 시행일 최소 7일 전 서비스 내 공지합니다.</p>
      </PolicySection>
    </StaticPageShell>
  )
}
