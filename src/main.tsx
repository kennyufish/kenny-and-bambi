import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { createRoot } from 'react-dom/client';
import { createStudio, type StudioController, type ViewMode } from './scene';
import { clockLabel, pageThemeAt } from './daylight';
import { labels, translatePortfolio, type Language } from './i18n';
import type { BambiState } from './bambi-motion';
import { setupWork } from './work';

const paths = {
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  scroll: 'M12 3v16m-5-5 5 5 5-5', orbit: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  pan: 'M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4m10-8 4 4-4 4',
  plus: 'M5 12h14M12 5v14', minus: 'M5 12h14', reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  camera: 'M3 7h5l2-3h4l2 3h5v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  full: 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',
  pause: 'M8 5v14M16 5v14', play: 'm8 4 12 8-12 8z', sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  close: 'm6 6 12 12M6 18 18 6'
};
function Action({ icon, label, compact, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: keyof typeof paths; label: string; compact?: boolean }) {
  return <button type="button" title={label} aria-label={label} {...props}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[icon]} /></svg>{!compact && <span>{label}</span>}</button>;
}
function savedLanguage(): Language {
  try { return localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch { return 'en'; }
}
function SceneHero() {
  const canvas = useRef<HTMLCanvasElement>(null), controller = useRef<StudioController | null>(null);
  const disclosure = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(false);
  const [language, setLanguage] = useState<Language>(savedLanguage);
  const [mode, setMode] = useState<ViewMode>('scroll');
  const [panel, setPanel] = useState(false), [pixel, setPixel] = useState(false), [fullscreen, setFullscreen] = useState(false);
  const [paused, setPaused] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [time, setTime] = useState(10), [cycling, setCycling] = useState(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [notice, setNotice] = useState<'saved' | 'captureError' | 'fullError' | null>(null);
  const [bambiState, setBambiState] = useState<BambiState>('watch');
  const ui = labels[language];
  useEffect(() => {
    const root = document.documentElement;
    try {
      const scene = createStudio(canvas.current!, () => { setError(true); controller.current?.setMode('scroll'); }, (hour, night) => {
        setTime(hour); root.dataset.night = String(night);
        Object.entries(pageThemeAt(hour)).forEach(([name, value]) => root.style.setProperty(`--${name}`, value));
      }, setBambiState);
      controller.current = scene; setReady(true);
      return () => {
        scene.dispose(); controller.current = null; delete root.dataset.night;
        Object.keys(pageThemeAt(12)).forEach(name => root.style.removeProperty(`--${name}`));
      };
    } catch (cause) { console.error('Scene initialization failed', cause); setError(true); }
  }, []);
  useEffect(() => { controller.current?.setMode(mode); }, [mode, ready]);
  useEffect(() => { controller.current?.setPixelated(pixel); }, [pixel, ready]);
  useEffect(() => { controller.current?.setPaused(paused); }, [paused, ready]);
  useEffect(() => { controller.current?.setCycling(cycling); }, [cycling, ready]);
  useEffect(() => {
    translatePortfolio(language);
    try { localStorage.setItem('portfolio-language', language); } catch { /* Language still works without storage. */ }
  }, [language]);
  useEffect(() => {
    const changed = () => setFullscreen(!!document.fullscreenElement);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motionChanged = (event: MediaQueryListEvent) => { setPaused(event.matches); if (event.matches) setCycling(false); };
    document.addEventListener('fullscreenchange', changed); preference.addEventListener('change', motionChanged);
    return () => { document.removeEventListener('fullscreenchange', changed); preference.removeEventListener('change', motionChanged); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  function changeTime(hour: number) { setCycling(false); controller.current?.setTime(hour); }
  async function capture() {
    try {
      const blob = await controller.current!.capture(), url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `kenny-bambi-${clockLabel(time).replace(':', '-')}.png`;
      document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('saved');
    } catch { setNotice('captureError'); }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector<HTMLElement>('#top')!.requestFullscreen();
    } catch { setNotice('fullError'); }
  }
  const unavailable = !ready || error;
  return <>
    <canvas ref={canvas} id="studio-canvas" tabIndex={0} aria-label={ui.description} aria-describedby="scene-keyboard-help" />
    {(!ready || error) && <p className="scene-status" role="status">{error ? ui.error : ui.loading}</p>}
    <div className="scene-controls">
      <a className="scene-scroll" href="#work"><svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={paths.scroll} /></svg>{ui.hint}</a>
      <div className="scene-actions" ref={disclosure}>
        <span className="scene-clock" aria-label={ui.time}>{clockLabel(time)}</span>
        <button type="button" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} lang={language === 'en' ? 'zh-CN' : 'en'}>{language === 'en' ? '中文' : 'EN'}</button>
        <Action icon={panel ? 'close' : 'settings'} label={panel ? ui.close : ui.settings} aria-expanded={panel} aria-controls="scene-panel" onClick={() => setPanel(!panel)} />
      </div>
      {panel && <div className="scene-panel" id="scene-panel" onKeyDown={event => { if (event.key === 'Escape') { setPanel(false); disclosure.current?.querySelector<HTMLButtonElement>('[aria-controls="scene-panel"]')?.focus(); } }}>
        <div className="scene-actions" role="group" aria-label={ui.settings}>
          {(['scroll', 'orbit', 'pan'] as const).map(value => <Action key={value} icon={value} label={ui[value]} disabled={unavailable} aria-pressed={mode === value} onClick={() => setMode(value)} />)}
          <Action icon="plus" label={ui.zoomIn} compact disabled={unavailable} onClick={() => controller.current?.zoom(.88)} />
          <Action icon="minus" label={ui.zoomOut} compact disabled={unavailable} onClick={() => controller.current?.zoom(1.14)} />
          <Action icon="reset" label={ui.reset} compact disabled={unavailable} onClick={() => controller.current?.resetView()} />
        </div>
        <div className="scene-actions">
          <button type="button" disabled={unavailable} aria-pressed={!pixel} onClick={() => setPixel(false)}>{ui.native}</button>
          <button type="button" disabled={unavailable} aria-pressed={pixel} onClick={() => setPixel(true)}>{ui.pixel}</button>
          <Action icon="camera" label={ui.capture} compact disabled={unavailable} onClick={capture} />
          <Action icon="full" label={fullscreen ? ui.exit : ui.full} compact disabled={unavailable} onClick={toggleFullscreen} />
          <Action icon={paused ? 'play' : 'pause'} label={paused ? ui.resume : ui.pause} compact disabled={unavailable} aria-pressed={paused} onClick={() => setPaused(!paused)} />
        </div>
        <div className="scene-time">
          <div className="scene-actions" role="group" aria-label={ui.bambiActions}>
            <span>{ui.bambiActions}</span>
            {(['run', 'play', 'sleep'] as const).map(action => <button type="button" key={action} disabled={unavailable || paused || bambiState !== 'watch'} onClick={() => controller.current?.playBambi(action)}>{ui.bambiButtons[action]}</button>)}
          </div>
          <p role="status">{ui.bambiStates[bambiState]}</p>
          <p>{ui.bambiTap}</p>
        </div>
        <div className="scene-time">
          <label htmlFor="scene-time">{ui.time} <output htmlFor="scene-time">{clockLabel(time)}</output></label>
          <input id="scene-time" type="range" min="0" max="23.99" step=".05" value={time} disabled={unavailable} aria-valuetext={clockLabel(time)} onChange={event => changeTime(Number(event.target.value))} />
          <div className="scene-actions time-presets">
            {([['sunrise', 6], ['noon', 12], ['sunset', 18], ['night', 0]] as const).map(([name, hour]) => <button type="button" key={name} disabled={unavailable} onClick={() => changeTime(hour)}>{ui[name]}</button>)}
            <Action icon={cycling ? 'pause' : 'play'} label={cycling ? ui.stopCycle : ui.cycle} compact disabled={unavailable} aria-pressed={cycling} onClick={() => { setCycling(!cycling); if (!cycling) setPaused(false); }} />
          </div>
        </div>
        <p>{matchMedia('(pointer: coarse)').matches ? ui.touch : ui.mouse}</p>
      </div>}
      <p id="scene-keyboard-help" className="visually-hidden">{ui.keys}</p>
      {notice && <p className="scene-notice" role="status">{ui[notice]}</p>}
    </div>
  </>;
}

createRoot(document.querySelector('#scene-root')!).render(<SceneHero />);
setupWork();
