import StaticPageShell from '@/components/matchda/landing/StaticPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '고객센터',
  description: '공고 추가, 영어 이력서 만들기, 구독 관리, 환불 등 MatchDa 자주 묻는 질문과 문의 방법을 안내합니다.',
}

const FAQS = [
  {
    q: '공고는 어떻게 추가하나요?',
    a: '지원 현황에서 채용공고 URL을 붙여넣거나, "직접 추가"에서 공고 페이지 전체를 복사(Ctrl+A → Ctrl+C)해 붙여넣으면 AI가 자동으로 정리해줍니다. 잡 탐색에서 수집한 공고는 "지원 현황에 추가"로 추가할 수 있어요. Indeed·LinkedIn·Glassdoor 같은 사이트에서 내 관심 직무·지역·키워드로 검색해두고(검색 조건 저장·잡 알림 활용), 마음에 드는 공고의 링크를 복사해 붙여넣으면 여러 잡보드의 공고를 한 곳에 모아 관리할 수 있어요.',
  },
  {
    q: '영어 이력서는 어떻게 만드나요?',
    a: '내 이력서 페이지에서 한국어로 작성하거나 이력서 파일(PDF·DOCX)을 업로드한 뒤 "영어로 동기화"를 누르면 전문가 수준의 영문 이력서가 생성됩니다.',
  },
  {
    q: '매칭 점수는 무엇인가요?',
    a: 'AI가 내 이력서와 채용 공고를 비교해 적합도를 0~100점으로 계산한 값입니다. 점수가 높을수록 요구사항과 내 경력이 잘 맞는다는 의미예요.',
  },
  {
    q: '맞춤 이력서가 뭔가요?',
    a: '지원할 공고의 요구사항(JD)에 맞춰 내 이력서의 강조점과 표현을 재구성한 이력서입니다. 원본에 없는 사실은 추가하지 않습니다.',
  },
  {
    q: '구독은 어떻게 해지하나요?',
    a: '요금제 페이지의 "구독 관리" 버튼을 누르면 Paddle 고객 포털에서 언제든 해지할 수 있습니다. 해지해도 현재 결제 주기 종료일까지 프리미엄이 유지됩니다.',
  },
  {
    q: '환불받고 싶어요.',
    a: '결제 후 7일 이내이고 프리미엄 기능을 실질적으로 사용하지 않았다면 환불 요청이 가능합니다. 자세한 조건은 환불 정책(/refund) 페이지를 확인하시고, support@matchda.com 또는 이 챗봇으로 결제 이메일과 결제일을 알려주시면 도와드릴게요.',
  },
  {
    q: '비밀번호를 바꾸고 싶어요.',
    a: '우측 상단 프로필 아이콘 → 설정에서 현재 비밀번호 확인 후 변경할 수 있습니다. 소셜 로그인 계정은 해당 서비스에서 관리하세요.',
  },
  {
    q: '계정을 삭제하고 싶어요.',
    a: '아래 이메일로 계정 삭제를 요청해주세요. 확인 후 관련 법령상 보존 의무가 있는 정보를 제외하고 지체 없이 파기합니다.',
  },
]

export default function SupportPage() {
  return (
    <StaticPageShell
      title="고객센터"
      subtitle="궁금한 점이 있으면 언제든 도와드릴게요."
    >
      {/* 문의 채널 */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[16px] border border-[#CEEBDC] bg-[#ECFDF3] p-6">
          <div className="text-[15px] font-bold text-[#046C4E]">💬 AI 챗봇 (가장 빠름)</div>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-[#3F5249]">
            화면 우측 하단의 초록 말풍선 버튼을 누르면 사용법·기능에 대해 바로 답해드립니다.
          </p>
        </div>
        <div className="rounded-[16px] border border-[#ECEEF0] bg-white p-6">
          <div className="text-[15px] font-bold text-[#1F2A37]">✉️ 이메일 문의</div>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-[#667085]">
            계정 삭제, 환불, 데이터 내보내기 등은{' '}
            <a href="mailto:support@matchda.com" className="font-medium text-[#046C4E] hover:underline">
              support@matchda.com
            </a>
            으로 보내주세요. 영업일 기준 1~2일 내 답변드립니다.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="mb-4 text-[20px] font-bold tracking-[-0.02em] text-[#101828]">자주 묻는 질문</h2>
      <div className="space-y-3">
        {FAQS.map(f => (
          <details
            key={f.q}
            className="group rounded-[14px] border border-[#ECEEF0] bg-white px-5 py-4 open:border-[#CEEBDC]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-[14.5px] font-semibold text-[#1F2A37] [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="ml-3 text-[#98A2B3] transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-[#667085]">{f.a}</p>
          </details>
        ))}
      </div>
    </StaticPageShell>
  )
}
