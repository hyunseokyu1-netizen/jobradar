// 제출 서류(공고별 다중 파일) 공용 타입·상수.
// 서버 액션('use server')은 async 함수만 export 가능하므로 여기에 분리한다.

export interface AppliedDocument {
  name: string        // 원본 파일명 (표시용)
  path: string        // Storage 경로
  size: number        // bytes
  uploadedAt: string  // ISO
}

export const MAX_APPLIED_DOCUMENTS = 5
