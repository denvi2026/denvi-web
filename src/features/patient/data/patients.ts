import type { Patient } from '../model/types'

/**
 * 개발 및 UI 테스트를 위한 가상 환자 데이터입니다.
 * 실제 환자의 개인정보나 진료 기록은 포함하지 않습니다.
 */
export const PATIENT_LIST: Patient[] = [
  {
    id: 'P-001',
    name: '김하늘',
    birthDate: '1992-04-21',
    gender: 'F',
    takenAt: '2025-12-12',
    history: '2023-09 충치 치료, 2024-03 스케일링',
  },
  {
    id: 'P-002',
    name: '이준호',
    birthDate: '1988-11-03',
    gender: 'M',
    takenAt: '2025-12-11',
    history: '2022-06 임플란트 상담',
  },
  {
    id: 'P-003',
    name: '박지수',
    birthDate: '1997-02-14',
    gender: 'F',
    takenAt: '2025-12-10',
    history: '2024-07 사랑니 발치',
  },
  {
    id: 'P-004',
    name: '정우진',
    birthDate: '1990-08-30',
    gender: 'M',
    takenAt: '2025-12-09',
    history: '2023-12 치주 치료',
  },
  {
    id: 'P-005',
    name: '최서연',
    birthDate: '1995-05-19',
    gender: 'F',
    takenAt: '2025-12-08',
    history: '과거 치료 정보 없음',
  },
]

