import '../../styles/player.css';
import { mountBattleDebug } from '../../game/battle/controller.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('缺少内部测试挂载点');
mountBattleDebug(root, new URLSearchParams(), true);
