import { build } from 'vite';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { codeRoot, documentationRoot } from './project-paths.mjs';

// 同一套真实视图与规则打包成离线HTML，图片、音效全部内嵌；不启动服务、不读写存档。
const target = path.join(documentationRoot, 'verification/chess-sample/chess-sample.html');
const trimUnusedStoryAssets = {
  name: 'chess-preview-trim',
  load(id) {
    const normalized = id.replaceAll('\\', '/');
    if (normalized.endsWith('/src/game/story/backgrounds.ts')) return 'export const backgroundBindings = {};';
    if (normalized.endsWith('/src/game/visual/static-portraits.ts')) return 'export const staticBindings = {};';
    if (normalized.endsWith('/src/content/overrides.json')) {
      return JSON.stringify({ displayNames: {}, portraits: {}, sceneHides: {}, battleHides: {}, stageNotes: {}, choiceReturns: [] });
    }
    return null;
  },
};
const result = await build({ root: codeRoot, configFile: false, logLevel: 'warn', base: '/',
  plugins: [trimUnusedStoryAssets],
  build: { write: false, minify: true, cssCodeSplit: false,
    lib: { entry: path.join(codeRoot, 'src/dev/chess-sample.ts'), formats: ['iife'], name: 'DWChessSample' } } });
const outputs = Array.isArray(result) ? result.flatMap(item => item.output) : result.output;
let javascript = outputs.find(item => item.type === 'chunk').code;
const css = outputs.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n');
const assets = { heroPiece: 'hero-piece.png', heroPoses: 'hero-poses.png', blackPiece: 'black-piece.png', blackPoses: 'black-poses.png' };
const images = await Promise.all(Object.entries(assets).map(async ([key, name]) => {
  const bytes = await readFile(path.join(codeRoot, 'public/assets/battle/chess-v1', name));
  return `<img hidden data-chess-asset="${key}" src="data:image/png;base64,${bytes.toString('base64')}">`;
}));
for (const name of await readdir(path.join(codeRoot, 'public/assets/audio/sfx'))) {
  if (!name.endsWith('.wav')) continue;
  const bytes = await readFile(path.join(codeRoot, 'public/assets/audio/sfx', name));
  javascript = javascript.replaceAll('/assets/audio/sfx/' + name, 'data:audio/wav;base64,' + bytes.toString('base64'));
}
const compact = `
@media(max-width:1000px){
#app{height:656px}.stage.battle-stage{width:720px;height:656px;left:50%;top:0;transform:translate(-50%,0) scale(var(--sample-scale,1))!important;transform-origin:top center}
.battle-header{left:16px;right:16px;top:8px!important;height:72px!important;gap:10px}.battle-title{width:194px}.battle-title h1{font-size:19px}.battle-title p{font-size:11px}
.initiative-strip{min-width:0}.initiative-card:not(.current){display:none}.initiative-card.current{width:132px;padding:4px 8px}.initiative-card strong{font-size:15px}.initiative-card span{font-size:12px}
.battle-header>.action-button{width:86px;min-height:32px;font-size:12px;padding:3px 8px}.chess-playback-controls .action-button{width:88px;font-size:13px}
.battle-board{left:24px;top:148px}.chess-sample-scenarios{left:24px;top:86px;width:672px;height:25px;display:flex;gap:6px}.chess-sample-scenarios .action-button{height:25px;padding:0 9px;font-size:12px}
.battle-roster,.battle-log-panel,.battle-actions,.movement-planning-controls,.battle-ability-panel{display:none!important}
.battle-footer{left:24px;top:632px;width:672px;height:20px;min-height:0;padding:0;border:0;overflow:hidden}.battle-footer p{display:none}.battle-footer .chess-inspection-label{display:block;font-size:12px}
.battle-modal{width:720px;height:656px}.battle-dialog{width:480px}
}`;
const fit = `const fit=()=>{const app=document.querySelector('#app'),stage=document.querySelector('.battle-stage');if(!app||!stage)return;const small=innerWidth<=1000,s=small?Math.min(1,app.clientWidth/720):1;stage.style.setProperty('--sample-scale',String(s));app.style.height=(small?656*s:720)+'px'};fit();addEventListener('resize',fit);`;
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>次元战争 · 棋子交战样例</title><style>${css.replace(/\b\d+(?:\.\d+)?d?vh\b/g, '720px')}
html,body{background:transparent!important}body{overflow:hidden}#app{width:100%;height:720px;max-height:none} .battle-stage{background:#101923}
${compact}</style></head><body><div id="app"></div>${images.join('')}<script>${javascript.replaceAll('</script', '<\\/script')};${fit}</script></body></html>`;
await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, html, 'utf8');
console.log(JSON.stringify({ path: target, bytes: Buffer.byteLength(html), embeddedImages: images.length }));
