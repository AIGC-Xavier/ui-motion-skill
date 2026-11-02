import { shiftLabel, animateValue, setPresence, animateLayout } from '../runtime/motion.mjs';

const $ = id => document.getElementById(id);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let stateRun = 0;
$('motion-preference').textContent = matchMedia('(prefers-reduced-motion: reduce)').matches ? '当前系统：减少动态效果已开启' : '当前系统：标准动效模式';

$('state-button').addEventListener('click', async () => {
  const run = ++stateRun;
  $('state-status').textContent = '正在演示异步处理';
  await shiftLabel($('state-label'), '处理中');
  if (run !== stateRun) return;
  await wait(550);
  if (run !== stateRun) return;
  await shiftLabel($('state-label'), '完成');
  if (run === stateRun) $('state-status').textContent = '处理已完成';
});

$('cancel-state').addEventListener('click', async () => {
  const run = ++stateRun;
  await shiftLabel($('state-label'), '开始演示');
  if (run !== stateRun) return;
  $('state-status').textContent = '已取消，保持最新状态';
});

$('rapid-state').addEventListener('click', async () => {
  const run = ++stateRun;
  shiftLabel($('state-label'), '处理中');
  await wait(45);
  if (run !== stateRun) return;
  await shiftLabel($('state-label'), '开始演示');
  if (run !== stateRun) return;
  $('state-status').textContent = '连续切换结束：应保持“开始演示”';
});

const panel = $('detail-panel');
let previousFocus;
let panelEpoch = 0;
async function openPanel(returnFocus = document.activeElement) {
  const epoch = ++panelEpoch;
  previousFocus = returnFocus;
  $('workbench').inert = true;
  document.querySelector('header').inert = true;
  document.querySelector('footer').inert = true;
  const work = setPresence(panel, true);
  $('preview-name').focus();
  await work;
  if (epoch === panelEpoch) $('panel-status').textContent = '打开完成';
  return epoch;
}
async function closePanel() {
  const epoch = ++panelEpoch;
  await setPresence(panel, false, { onAfterExit() {
    if (epoch !== panelEpoch) return;
    $('workbench').inert = false;
    document.querySelector('header').inert = false;
    document.querySelector('footer').inert = false;
    previousFocus?.focus();
  } });
}
$('open-panel').addEventListener('click', () => openPanel());
$('close-panel').addEventListener('click', closePanel);
$('reverse-panel').addEventListener('click', async () => {
  const returnFocus = previousFocus;
  closePanel();
  const closingEpoch = panelEpoch;
  await wait(40);
  if (closingEpoch !== panelEpoch) return;
  const openingEpoch = await openPanel(returnFocus);
  if (openingEpoch !== panelEpoch) return;
  $('panel-status').textContent = '反转完成：面板应保持打开';
});
panel.addEventListener('click', event => { if (event.target === panel) closePanel(); });
panel.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closePanel(); }
  if (event.key !== 'Tab') return;
  const focusable = [...panel.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

let visibleValue = 0;
let valueTarget = 100;
let valueMotion;
$('run-value').addEventListener('click', () => {
  valueMotion?.cancel();
  valueMotion = animateValue(visibleValue, valueTarget, {
    duration: 850,
    onUpdate(value) { visibleValue = value; $('value-output').value = String(Math.round(value)); $('value-bar').style.width = `${Math.max(0, Math.min(100, value))}%`; },
  });
  $('value-status').textContent = `目标：${valueTarget}`;
  valueTarget = valueTarget === 100 ? 20 : 100;
});
$('stop-value').addEventListener('click', () => { valueMotion?.cancel(); $('value-status').textContent = `已停止在 ${Math.round(visibleValue)}`; });

$('reorder-list').addEventListener('click', async () => {
  const button = $('reorder-list');
  if (button.disabled) return;
  button.disabled = true;
  const list = $('motion-list');
  try {
    await animateLayout(list, async () => {
      list.prepend(list.lastElementChild);
      await new Promise(requestAnimationFrame);
    });
    $('list-status').textContent = `当前首项：${list.firstElementChild.firstElementChild.textContent}`;
  } catch {
    $('list-status').textContent = '排序失败，可重试';
  } finally {
    button.disabled = false;
  }
});
