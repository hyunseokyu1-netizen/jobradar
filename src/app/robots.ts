import type { MetadataRoute } from 'next'

const SITE_URL = 'https://matchda.com'

/**
 * 로그인 없이 실제 콘텐츠가 보이는 공개 페이지만 크롤링 허용.
 * 나머지(대시보드·워크스페이스 등)는 미들웨어가 /login으로 리다이렉트하므로
 * 크롤링해도 인덱싱할 내용이 없다 — 크롤 버짓 낭비를 막기 위해 명시적으로 차단.
 * /r/<slug>(공개 이력서 공유)는 링크를 아는 사람만 보게 하는 용도라 검색 노출 차단.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/pricing', '/terms', '/privacy', '/refund', '/support'],
      disallow: [
        '/dashboard', '/applications', '/discover', '/profile', '/workspace',
        '/settings', '/onboarding', '/login', '/auth', '/api', '/matchda', '/r/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
