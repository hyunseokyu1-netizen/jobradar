import StaticPageShell, { PolicySection } from '@/components/matchda/landing/StaticPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '환불 정책',
  description: 'MatchDa 프리미엄 구독의 환불 가능 조건, 제한 사유, 요청 방법을 안내합니다.',
  alternates: { canonical: '/refund' },
}

export default function RefundPage() {
  return (
    <StaticPageShell title="환불 정책" subtitle="시행일: 2026년 7월 4일">
      <PolicySection title="1. 적용 대상">
        <p>
          이 환불 정책은 MatchDa(매치다, 이하 &ldquo;회사&rdquo;)의 프리미엄 구독 결제에 적용됩니다.
          결제는 결제 대행사 <b className="text-[#1F2A37]">Paddle.com</b>이 판매자(Merchant of Record)로서 처리하며,
          카드 청구서에는 &ldquo;PADDLE.NET* MATCHDA&rdquo; 또는 이와 유사한 표기로 나타날 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection title="2. 환불 가능 조건">
        <p>
          아래 조건을 모두 충족하는 경우, 결제일로부터 <b className="text-[#1F2A37]">7일 이내</b>에 전액 환불을
          요청할 수 있습니다.
        </p>
        <p>· 최초 구독 결제이거나, 재구독 후 결제일로부터 7일이 지나지 않았을 것</p>
        <p>· 프리미엄 기능(맞춤 이력서·커버레터 무제한 생성, 채용페이지 무제한 등록 등)을 실질적으로 사용하지 않았을 것</p>
        <p>
          &ldquo;실질적 사용&rdquo;은 프리미엄 전용 기능(예: 무료 한도를 초과한 맞춤 이력서 다건 생성)을
          반복적으로 이용한 경우를 말하며, 단순 로그인이나 요금제 페이지 열람은 포함되지 않습니다.
        </p>
      </PolicySection>

      <PolicySection title="3. 환불이 제한되는 경우">
        <p>· 결제일로부터 7일이 경과한 경우</p>
        <p>· 프리미엄 기능을 이미 실질적으로 사용한 경우</p>
        <p>· 약관 위반(부정 이용, 어뷰징 등)으로 서비스 이용이 제한된 경우</p>
        <p>
          위 경우에도 소비자 보호 관련 법령상 환불 의무가 있는 사안이라면 해당 법령을 우선하여 처리합니다.
        </p>
      </PolicySection>

      <PolicySection title="4. 구독 해지와 환불의 차이">
        <p>
          구독 해지는 <b className="text-[#1F2A37]">다음 결제를 막는 것</b>이며, 이미 결제한 금액을 즉시 돌려받는
          것이 아닙니다. 요금제 페이지의 &ldquo;구독 관리&rdquo; 버튼을 누르면 Paddle 고객 포털에서 언제든 해지할
          수 있고, 해지해도 현재 결제 주기 종료일까지는 프리미엄 기능을 계속 이용할 수 있습니다.
        </p>
        <p>이미 결제한 금액을 돌려받고 싶다면 아래 5번의 방법으로 별도로 환불을 요청해야 합니다.</p>
      </PolicySection>

      <PolicySection title="5. 환불 요청 방법">
        <p>
          아래 방법 중 하나로 요청해주세요. 결제 시 사용한 이메일과 결제일을 함께 알려주시면 처리가 빨라집니다.
        </p>
        <p>
          · 이메일:{' '}
          <a href="mailto:support@matchda.com" className="font-medium text-[#046C4E] hover:underline">
            support@matchda.com
          </a>
        </p>
        <p>· 고객센터 챗봇(우측 하단) 또는 <a href="/support" className="font-medium text-[#046C4E] hover:underline">고객센터 페이지</a></p>
        <p>
          환불이 승인되면 결제에 사용된 수단으로 영업일 기준 5~10일 이내 환불되며, 카드사·은행 사정에 따라
          반영까지 추가 시일이 걸릴 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection title="6. 결제 관련 문의">
        <p>
          청구 내역이나 결제 자체에 대한 문의(중복 결제, 청구서 표기 등)는 회사 또는 Paddle 고객지원으로
          문의할 수 있습니다.
        </p>
      </PolicySection>
    </StaticPageShell>
  )
}
