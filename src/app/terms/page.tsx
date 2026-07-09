import StaticPageShell, { PolicySection } from '@/components/matchda/landing/StaticPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '서비스 약관',
  description: 'MatchDa 서비스 이용약관 — 서비스 제공 범위, 유료 구독, 회원의 권리와 의무를 안내합니다.',
}

export default function TermsPage() {
  return (
    <StaticPageShell title="서비스 약관" subtitle="시행일: 2026년 7월 4일">
      <PolicySection title="제1조 (목적)">
        <p>
          이 약관은 MatchDa(매치다, 이하 &ldquo;회사&rdquo;)가 제공하는 AI 기반 이력서 번역·최적화 및
          채용 공고 매칭 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 회원 간의 권리,
          의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </PolicySection>

      <PolicySection title="제2조 (정의)">
        <p>1. &ldquo;서비스&rdquo;란 이력서 번역·맞춤화, 채용 공고 수집·매칭, 커버레터 생성, 지원 현황 관리 등 회사가 제공하는 일체의 기능을 말합니다.</p>
        <p>2. &ldquo;회원&rdquo;이란 이 약관에 동의하고 계정을 생성하여 서비스를 이용하는 자를 말합니다.</p>
        <p>3. &ldquo;프리미엄&rdquo;이란 유료 구독을 통해 이용할 수 있는 확장 기능을 말합니다.</p>
      </PolicySection>

      <PolicySection title="제3조 (약관의 효력 및 변경)">
        <p>1. 이 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.</p>
        <p>2. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자와 개정 사유를 명시하여 최소 7일 전에 공지합니다.</p>
      </PolicySection>

      <PolicySection title="제4조 (서비스의 제공)">
        <p>1. 회사는 다음 서비스를 제공합니다: 한국어 이력서의 영어 번역 및 편집, 채용 공고 자동 수집 및 AI 적합도 채점, 공고 맞춤형 이력서·커버레터 생성, 지원 현황 관리, 고객지원 챗봇.</p>
        <p>2. 서비스는 연중무휴 제공을 원칙으로 하나, 시스템 점검·장애·외부 서비스(AI 모델, 채용 사이트 등) 사정에 따라 일시 중단될 수 있습니다.</p>
      </PolicySection>

      <PolicySection title="제5조 (AI 생성 결과물에 관한 안내)">
        <p>1. 서비스가 생성하는 번역·이력서·커버레터·매칭 점수는 AI 모델의 결과물로, 정확성·완전성이 보장되지 않습니다.</p>
        <p>2. 회원은 생성된 결과물을 제출 전 반드시 직접 검토해야 하며, 결과물 사용으로 발생하는 결과(채용 여부 등)에 대해 회사는 책임을 지지 않습니다.</p>
        <p>3. 맞춤 이력서는 회원이 입력한 원본 이력서의 사실 정보만을 재구성하도록 설계되어 있으나, 최종 사실 확인 책임은 회원에게 있습니다.</p>
      </PolicySection>

      <PolicySection title="제6조 (유료 서비스 및 결제)">
        <p>1. 프리미엄 구독 요금과 제공 기능은 요금제 페이지에 게시하며, 결제는 Paddle을 통해 처리됩니다.</p>
        <p>2. 구독은 월 단위로 자동 갱신되며, 회원은 언제든지 구독 관리(고객 포털)에서 해지할 수 있습니다. 해지 시 현재 결제 주기의 종료일까지 프리미엄이 유지됩니다.</p>
        <p>
          3. 환불은 <a href="/refund" className="font-medium text-[#046C4E] hover:underline">환불 정책</a>에
          따르며, 결제 후 7일 이내이고 프리미엄 기능을 실질적으로 사용하지 않은 경우 고객센터를 통해 요청할 수
          있습니다.
        </p>
      </PolicySection>

      <PolicySection title="제7조 (회원의 의무)">
        <p>1. 회원은 본인의 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.</p>
        <p>2. 회원은 서비스를 다음 목적으로 이용해서는 안 됩니다: 허위 경력·학력 생성 요청, 서비스의 비정상적 대량 호출, 시스템에 대한 공격 또는 취약점 악용, 관련 법령 위반 행위.</p>
        <p>3. 계정 및 비밀번호 관리 책임은 회원에게 있습니다.</p>
      </PolicySection>

      <PolicySection title="제8조 (지식재산권)">
        <p>1. 서비스와 관련된 소프트웨어, 디자인, 상표 등에 대한 권리는 회사에 귀속됩니다.</p>
        <p>2. 회원이 입력한 이력서 등 콘텐츠와 그로부터 생성된 결과물에 대한 권리는 회원에게 귀속되며, 회사는 서비스 제공 목적 범위에서만 이를 처리합니다.</p>
      </PolicySection>

      <PolicySection title="제9조 (계약 해지 및 이용 제한)">
        <p>1. 회원은 언제든지 고객센터를 통해 계정 삭제를 요청할 수 있습니다.</p>
        <p>2. 회사는 회원이 이 약관을 위반한 경우 사전 통지 후 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.</p>
      </PolicySection>

      <PolicySection title="제10조 (책임의 제한)">
        <p>1. 회사는 천재지변, 외부 서비스 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</p>
        <p>2. 회사의 손해배상 책임은 관련 법령이 허용하는 범위에서 회원이 최근 3개월간 회사에 지급한 이용 요금을 한도로 합니다.</p>
      </PolicySection>

      <PolicySection title="제11조 (준거법 및 분쟁 해결)">
        <p>이 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁은 상호 협의로 해결하되, 협의가 이루어지지 않을 경우 관할 법원에 제소할 수 있습니다.</p>
      </PolicySection>

      <PolicySection title="문의">
        <p>
          약관에 대한 문의: <a href="mailto:support@matchda.com" className="font-medium text-[#046C4E] hover:underline">support@matchda.com</a>
        </p>
      </PolicySection>
    </StaticPageShell>
  )
}
