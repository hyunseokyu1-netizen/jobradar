import type { PublicTestimonial } from '@/lib/matchda/data'

/**
 * 랜딩 후기 섹션.
 * 실제 공개 동의 후기(user_feedback.allow_public)가 있으면 그것만 보여주고,
 * 아직 없으면 "예시" 배지가 붙은 샘플 카드로 폴백한다 — 실후기가 쌓이면 자동 대체.
 * (가짜 후기를 진짜처럼 보이게 하지 않는다: 예시 표기는 유지할 것)
 */

const SAMPLE_TESTIMONIALS: PublicTestimonial[] = [
  {
    rating: 5,
    content:
      '한국어로 쓰면 영어 이력서가 바로 나오는 게 제일 편해요. 공고마다 이력서 고치는 시간이 확 줄었어요.',
    name: '준영 · 시드니 취업 준비',
  },
  {
    rating: 5,
    content:
      '회사 채용페이지를 등록해두면 새 공고에 매칭 점수가 붙어서 나와요. 뭐부터 지원할지 고르기 좋아요.',
    name: '민재 · 오클랜드 이직 준비',
  },
  {
    rating: 4,
    content:
      '지원한 공고를 준비-지원-면접 보드로 관리하니까 어디까지 진행됐는지 한눈에 보여요. 스프레드시트 졸업했습니다.',
    name: '소연 · 멜번 워킹홀리데이',
  },
]

function Stars({ n }: { n: number }) {
  return (
    <div className="text-[14px] leading-none" aria-label={`별점 ${n}점`}>
      {'⭐'.repeat(n)}
    </div>
  )
}

export default function TestimonialsSection({ items }: { items: PublicTestimonial[] }) {
  const isSample = items.length === 0
  const shown = isSample ? SAMPLE_TESTIMONIALS : items

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-4 pt-14 sm:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-[26px] font-bold leading-[1.25] tracking-[-0.02em] text-[#0B1A12] sm:text-[32px]">
          먼저 써본 사람들의 이야기
        </h2>
        {isSample && (
          <p className="mt-2 text-[13px] text-[#98A2B3]">
            아래는 사용 시나리오 예시예요. 실제 사용자 후기가 쌓이는 대로 이 자리에 소개됩니다.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {shown.map((item, i) => (
          <figure
            key={i}
            className="relative flex flex-col rounded-[16px] border border-[#EAECEF] bg-white p-6"
          >
            {isSample && (
              <span className="absolute right-4 top-4 rounded-full bg-[#F4F6F8] px-2 py-0.5 text-[11px] font-medium text-[#98A2B3]">
                예시
              </span>
            )}
            <Stars n={item.rating} />
            <blockquote className="mt-3 flex-1 text-[14.5px] leading-[1.65] text-[#344054]">
              “{item.content}”
            </blockquote>
            <figcaption className="mt-4 text-[13px] font-semibold text-[#667085]">
              {item.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
