'use server'

import { runMatching } from '@/lib/matching'

export async function triggerMatching() {
  try {
    const result = await runMatching()
    return result
  } catch (e) {
    return { error: String(e), matched: 0, errors: 0 }
  }
}
