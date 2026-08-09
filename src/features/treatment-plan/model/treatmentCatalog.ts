import type { TreatmentCategory, TreatmentItem } from './types'

export const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  {
    id: 'conservative',
    label: '보존 치료',
    color: 'blue',
    items: [
      { id: 'c1', name: '충치치료 (레진)', description: '콤포짓 레진으로 우식 부위를 제거하고 치아색에 맞춰 직접 수복', phase: 'P2' },
      { id: 'c2', name: '인레이 / 온레이', description: '레진·세라믹·금 등 재료별 인레이 또는 온레이로 구치부를 수복', phase: 'P2' },
      { id: 'c3', name: '신경치료 (근관치료)', description: '감염된 치수와 근관을 세정·성형·충전해 자연치아를 보존', phase: 'MVP', rootOverlay: true },
    ],
  },
  {
    id: 'periodontal',
    label: '치주 치료',
    color: 'green',
    items: [
      { id: 'p1', name: '스케일링', description: '치아 표면의 치석과 치태를 제거하는 기본 치주 관리', phase: 'P2' },
      { id: 'p2', name: '치근활택술 (SRP)', description: '치주낭 내 오염된 치근면을 활택해 치주 염증을 조절', phase: 'P2' },
      { id: 'p3', name: '치주판막술', description: '치주낭을 외과적으로 개방해 치석과 염증 조직을 제거', phase: 'P3' },
      { id: 'p4', name: '치주조직재생술', description: 'GTR·골이식으로 손상된 치주 조직과 치조골 재생을 유도', phase: 'P3' },
      { id: 'p5', name: '치은이식술 (잇몸이식)', description: '치은퇴축 부위에 조직을 이식해 잇몸 형태와 심미성을 회복', phase: 'P2' },
    ],
  },
  {
    id: 'prosthodontic',
    label: '보철 치료',
    color: 'amber',
    rootOverlay: true,
    items: [
      { id: 'pr1', name: '크라운', description: '손상된 치아 전체를 보철물로 덮어 형태와 기능을 회복', phase: 'MVP' },
      { id: 'pr2', name: '브릿지', description: '결손 치아 양옆 지대치를 이용해 고정성 보철로 수복', phase: 'MVP' },
      { id: 'pr3', name: '임플란트', description: '치조골에 픽스처를 식립하고 상부 보철로 결손 치아를 대체', phase: 'MVP', rootOverlay: true },
      { id: 'pr4', name: '의치 (틀니)', description: '부분 또는 완전 결손 부위를 가철성 보철 장치로 수복', phase: 'P2' },
      { id: 'pr5', name: '풀아치 보철 (All-on-X)', description: '다수 임플란트 기반의 전악 고정성 보철 계획', phase: 'P3', rootOverlay: true },
    ],
  },
  {
    id: 'oral-surgery',
    label: '구강외과',
    color: 'orange',
    items: [
      { id: 'os1', name: '사랑니 발치', description: '매복 또는 맹출된 사랑니를 외과적으로 발치', phase: 'P2' },
      { id: 'os2', name: '일반 발치', description: '보존이 어려운 치아를 발치하고 이후 치료 옵션을 계획', phase: 'P2' },
      { id: 'os3', name: '치조골 보존술', description: '발치 후 골이식재로 치조골 흡수를 줄여 보철·임플란트 기반을 보존', phase: 'P2', rootOverlay: true },
    ],
  },
  {
    id: 'aesthetic',
    label: '심미치료',
    color: 'pink',
    items: [
      { id: 'a1', name: '라미네이트', description: '치아 표면에 얇은 도재 또는 레진 베니어를 부착해 색과 형태를 개선', phase: 'P2' },
      { id: 'a2', name: '치아미백', description: '미백제를 이용해 치아 색조를 밝게 개선', phase: 'P2' },
      { id: 'a3', name: '치관연장술 (잇몸성형)', description: '잇몸 라인을 조정해 치아 길이와 미소선을 개선', phase: 'P2' },
      { id: 'a4', name: '치아성형 (엣지 미세삭제)', description: '치아 절단연과 형태를 미세하게 다듬는 보조적 심미 처치', phase: 'P3' },
    ],
  },
  {
    id: 'orthodontic',
    label: '교정치료',
    color: 'teal',
    items: [
      { id: 'or1', name: '일반교정 (브라켓)', description: '브라켓과 와이어를 이용해 치열과 교합을 단계적으로 이동', phase: 'P2' },
      { id: 'or2', name: '투명교정', description: '탈착 가능한 투명 얼라이너로 치아 이동을 계획', phase: 'P2' },
      { id: 'or3', name: '부분교정', description: '전치부 등 제한된 부위의 치열을 단기간에 개선', phase: 'P2' },
    ],
  },
  {
    id: 'pediatric-preventive',
    label: '소아·예방치료',
    color: 'indigo',
    items: [
      { id: 'pp1', name: '홈메우기 (실란트)', description: '어금니 홈을 실란트로 메워 우식 발생 위험을 낮추는 예방 처치', phase: 'P3' },
      { id: 'pp2', name: '불소도포', description: '불소를 도포해 법랑질을 강화하고 초기 우식 위험을 낮추는 예방 처치', phase: 'P3' },
    ],
  },
]

export function isRootOverlayCategory(categoryId: string): boolean {
  return categoryId === 'prosthodontic'
}

export const PHASE_LABELS: Record<TreatmentItem['phase'], string> = {
  MVP: 'MVP',
  P2: 'P2',
  P3: '준비중',
}

export const PHASE_BADGE_CLASSES: Record<TreatmentItem['phase'], string> = {
  MVP: 'bg-[#fff4cf] text-[#9b6a11] border-[#ead797]',
  P2: 'bg-[#edf5ff] text-[#24507a] border-[#cfe3f8]',
  P3: 'bg-[#f2f4f7] text-[#98a2b3] border-[#e4e7ec]',
}

export const CATEGORY_COLORS: Record<string, { bg: string; active: string; text: string; hover: string }> = {
  conservative:   { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
  periodontal:    { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
  prosthodontic:  { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
  'oral-surgery': { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
  aesthetic:      { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
  orthodontic:    { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
  'pediatric-preventive': { bg: 'bg-den-blue-soft', active: 'bg-den-blue text-white', text: 'text-den-blue', hover: 'hover:bg-den-blue-hover' },
}
