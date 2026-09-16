const clamp = (value: number) => Math.max(0, Math.min(1, value));

// An artistic 24-hour loop, not a geographic sunrise calculator.
export function daylightAt(hour: number) {
  const time = ((Number.isFinite(hour) ? hour : 12) % 24 + 24) % 24;
  const angle = (time - 6) / 24 * Math.PI * 2;
  const elevation = Math.sin(angle);
  return { time, angle, elevation, daylight: clamp((elevation + .14) / .7), warmth: clamp(1 - Math.abs(elevation) * 4), night: elevation < -.12 };
}

export function clockLabel(hour: number) {
  const minutes = Math.floor(daylightAt(hour).time * 60) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// Shared by the page and PNG capture; the WebGL canvas itself is transparent.
export function pageThemeAt(hour: number) {
  const { elevation } = daylightAt(hour);
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const hex = (rgb: number[]) => `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  // Stay light until sunset, then fade through peach twilight into blue night.
  // Reusing light intensity here would dim the page to gray before sunset.
  const paper = elevation >= 0
    ? mix([244, 244, 240], [246, 221, 199], clamp(1 - elevation / .4))
    : mix([24, 32, 43], [246, 221, 199], clamp(1 + elevation / .35));
  const luminanceOf = (rgb: number[]) => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const luminance = luminanceOf(paper), dark = luminance < .179;
  const ink = dark ? '#ffffff' : luminance < .24 ? '#000000' : '#171918';
  const readable = (color: string, fallback = ink) => {
    for (const candidate of [color, fallback]) {
      const foreground = luminanceOf(candidate.slice(1).match(/../g)!.map(value => parseInt(value, 16)));
      if ((Math.max(luminance, foreground) + .05) / (Math.min(luminance, foreground) + .05) >= 4.5) return candidate;
    }
    return ink;
  };
  return {
    paper: hex(paper), 'paper-deep': hex(mix(paper, dark ? [0, 8, 18] : [167, 158, 144], .12)),
    'paper-warm': hex(mix(paper, dark ? [65, 44, 46] : [236, 169, 145], .2)),
    ink, graphite: readable(dark ? '#c9d0da' : '#4b514e'),
    hairline: hex(mix(paper, dark ? [223, 230, 240] : [36, 43, 40], .3)),
    signal: readable(dark ? '#ff9c7e' : '#c83927', dark ? '#ffe4d8' : '#671a10'),
    'signal-dark': readable(dark ? '#ffab90' : '#a82b1c', dark ? '#ffe4d8' : '#671a10')
  };
}
