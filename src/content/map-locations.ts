export type LocationId = 'sample_site_1' | 'sample_site_2';
export type MapLocation = { id: LocationId; name: string; position: { x: number; y: number } };

/** Coordinates exist only to place nodes on the synthetic demo map. */
export const mapLocations: readonly MapLocation[] = [
  { id: 'sample_site_1', name: 'Sample site one', position: { x: .28, y: .46 } },
  { id: 'sample_site_2', name: 'Sample site two', position: { x: .73, y: .34 } },
];
export const locationById = (id: LocationId) => mapLocations.find(item => item.id === id)!;