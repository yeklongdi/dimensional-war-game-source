import { assetUrl } from '../asset-url.js';
import type { BattleMapId } from './types.js';

export type BattleMapMedia = {
  readonly id: BattleMapId;
  readonly title: string;
  readonly video: string;
  readonly poster: string;
};

export const battleMapMedia: Record<BattleMapId, BattleMapMedia> = {
  warehouse: {
    id: 'warehouse',
    title: '科幻仓库',
    video: assetUrl('/assets/battle/maps-v1/warehouse.webm'),
    poster: assetUrl('/assets/battle/maps-v1/warehouse.webp'),
  },
  alley: {
    id: 'alley',
    title: '赛博朋克后巷',
    video: assetUrl('/assets/battle/maps-v1/alley.webm'),
    poster: assetUrl('/assets/battle/maps-v1/alley.webp'),
  },
  lab: {
    id: 'lab',
    title: '物质测试实验室',
    video: assetUrl('/assets/battle/maps-v1/lab.webm'),
    poster: assetUrl('/assets/battle/maps-v1/lab.webp'),
  },
  facility: {
    id: 'facility',
    title: '研究设施',
    video: assetUrl('/assets/battle/maps-v1/facility.webm'),
    poster: assetUrl('/assets/battle/maps-v1/facility.webp'),
  },
};
