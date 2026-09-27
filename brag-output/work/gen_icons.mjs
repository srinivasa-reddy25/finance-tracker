import * as mdi from '@mdi/js';
import fs from 'fs';
const names = {
  food: 'mdiFoodForkDrink', transport: 'mdiCarOutline', shopping: 'mdiShoppingOutline', bills: 'mdiReceiptTextOutline',
  entertainment: 'mdiTelevisionPlay', health: 'mdiHeartPulse', others: 'mdiShapeOutline', plus: 'mdiPlus',
  home: 'mdiHomeOutline', history: 'mdiHistory', poll: 'mdiPoll', account: 'mdiAccountOutline', repeat: 'mdiRepeat',
  report: 'mdiFileChartOutline', alert: 'mdiAlertCircleOutline', chevronDown: 'mdiChevronDown', close: 'mdiClose',
  wifi: 'mdiWifi', signal: 'mdiSignalCellular3', lock: 'mdiLock', flashlight: 'mdiFlashlight', camera: 'mdiCamera',
  check: 'mdiCheck', bell: 'mdiBellOutline', calendar: 'mdiCalendarBlankOutline', trendDown: 'mdiTrendingDown',
  magnify: 'mdiMagnify', tune: 'mdiTuneVariant'
};
const out = {};
for (const [k, v] of Object.entries(names)) { if (!mdi[v]) throw new Error('missing ' + v); out[k] = mdi[v]; }
fs.writeFileSync('site/icons.js', 'window.ICONS = ' + JSON.stringify(out) + ';\n');
console.log('icons', Object.keys(out).length);
