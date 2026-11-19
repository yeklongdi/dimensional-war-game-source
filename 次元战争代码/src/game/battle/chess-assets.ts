import { assetUrl } from '../asset-url.js';

export type ChessSubject = 'hero' | 'black';
export type ChessAssetKey = 'heroPiece' | 'heroPoses' | 'blackPiece' | 'blackPoses';
export type ChessAssetUrls = Partial<Record<ChessAssetKey, string>>;
const files: Record<ChessAssetKey, string> = {
  heroPiece: 'hero-piece.png', heroPoses: 'hero-poses.png', blackPiece: 'black-piece.png', blackPoses: 'black-poses.png',
};

export class ChessAssets {
  private readonly images = new Map<ChessAssetKey, HTMLImageElement>();
  readonly ready: Promise<void>;
  failed = false;
  constructor(repaint: () => void, urls: ChessAssetUrls = {}) {
    this.ready = Promise.all(Object.entries(files).map(async ([name, file]) => {
      const key = name as ChessAssetKey, image = new Image();
      image.src = urls[key] ?? assetUrl('/assets/battle/chess-v1/' + file);
      try { await image.decode(); this.images.set(key, image); }
      catch { this.failed = true; console.warn('[次元战争:战斗棋子] 素材加载失败，显示占位：' + file); }
    })).then(() => repaint());
  }
  image(subject: ChessSubject, type: 'Piece' | 'Poses') { return this.images.get((subject + type) as ChessAssetKey); }
}
