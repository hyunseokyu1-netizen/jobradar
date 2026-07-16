import { describe, it, expect } from 'vitest'
import { detectPlatform } from '@/lib/detect-platform'

describe('detectPlatform — 공고 URL의 잡보드 판별', () => {
  it.each([
    ['https://www.seek.com.au/job/12345678', 'seek'],
    ['https://au.indeed.com/viewjob?jk=abc', 'indeed'],
    ['https://www.linkedin.com/jobs/view/123', 'linkedin'],
    ['https://www.glassdoor.com.au/job-listing/x', 'glassdoor'],
    ['https://jobs.apple.com/en-us/details/200123', 'apple'],
    ['https://boards.greenhouse.io/stripe/jobs/1', 'other'],
    ['manual://uuid-here', 'other'],
  ] as const)('%s → %s', (url, expected) => {
    expect(detectPlatform(url)).toBe(expected)
  })
})
