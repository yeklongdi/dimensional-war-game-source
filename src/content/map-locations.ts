export type LocationId = 'grandma_home' | 'school_road' | 'high_school' | 'old_warehouse' | 'construction_site';
export type MapLocation = { id: LocationId; name: string; position: { x: number; y: number } };

/** 美术布局坐标，北朝上；不表示正式距离。最终按彩绘建筑落点校对。 */
export const mapLocations: readonly MapLocation[] = [
  { id: 'grandma_home', name: '奶奶家', position: { x: .19, y: .39 } },
  { id: 'old_warehouse', name: '旧街区仓库', position: { x: .485, y: .70 } },
  { id: 'school_road', name: '上学路口', position: { x: .365, y: .505 } },
  { id: 'high_school', name: '太阳市第一高中', position: { x: .655, y: .322 } },
  { id: 'construction_site', name: '施工区域', position: { x: .912, y: .105 } },
];
export const locationById = (id: LocationId) => mapLocations.find(item => item.id === id)!;
