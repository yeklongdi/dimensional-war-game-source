import './styles/player.css';
import './styles/menu.css';
import './styles/map.css';
import { mountPlayer } from './game/controller.js';
import { mountBattleDebug } from './game/battle/controller.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('缺少游戏挂载点 #app');
const search = new URLSearchParams(location.search);
const dispose = search.get('debug') === 'battle' ? mountBattleDebug(root, search) : mountPlayer(root, search);
import.meta.hot?.dispose(dispose);
