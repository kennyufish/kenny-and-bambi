// Native document scrolling, sticky sheets, and a native modal; no motion runtime.
export function stackProgress(nextTop: number, stickyTop: number, height: number) {
  return Math.max(0, Math.min(1, 1 - (nextTop - stickyTop) / Math.max(1, height)));
}

export function setupWork() {
  const work = document.querySelector<HTMLElement>('#work');
  const dialog = document.querySelector<HTMLDialogElement>('#work-dialog');
  if (!work || !dialog || typeof dialog.showModal !== 'function') return;
  const cards = Array.from(work.querySelectorAll<HTMLElement>('.work-card'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 64rem) and (min-height: 44rem) and (hover: hover)');
  const video = work.querySelector<HTMLVideoElement>('video')!;
  const videoButton = work.querySelector<HTMLButtonElement>('.work-video-toggle')!;
  const summary = dialog.querySelector<HTMLElement>('.work-detail-summary')!;
  let visible = false, videoVisible = false, userPaused = reduced.matches, frame = 0;
  let opener: HTMLButtonElement | null = null;
  let backdropDown = false;

  const updateVideo = () => {
    const play = videoVisible && !document.hidden && !dialog.open && !userPaused;
    videoButton.setAttribute('aria-pressed', String(!play));
    if (play) void video.play().catch(() => videoButton.setAttribute('aria-pressed', 'true'));
    else video.pause();
  };
  videoButton.hidden = false;
  videoButton.addEventListener('click', () => { userPaused = !video.paused; updateVideo(); });

  const paint = () => {
    frame = 0;
    if (!visible || document.hidden || dialog.open || reduced.matches) return;
    const rects = cards.map(card => card.getBoundingClientRect());
    cards.forEach((card, index) => {
      const next = rects[index + 1];
      const progress = work.classList.contains('work-stacked') && next
        ? stackProgress(next.top, parseFloat(getComputedStyle(card).top), rects[index].height) : 0;
      card.style.setProperty('--stack-progress', progress.toFixed(4));
      if (desktop.matches) card.style.setProperty('--image-drift', `${Math.max(-5, Math.min(5, (rects[index].top / innerHeight - .4) * 12))}px`);
    });
  };
  const schedule = () => { if (!frame && visible && !document.hidden && !dialog.open && !reduced.matches) frame = requestAnimationFrame(paint); };
  const measure = () => {
    const fits = cards.every((card, index) => card.offsetHeight + 96 + index * 12 + 24 < innerHeight);
    work.classList.toggle('work-stacked', desktop.matches && !reduced.matches && fits);
    if (reduced.matches) {
      userPaused = true;
      cards.forEach(card => card.style.removeProperty('--stack-progress'));
    }
    updateVideo(); schedule();
  };
  cards.forEach((card, index) => {
    card.style.setProperty('--card-index', String(index));
    const visual = card.querySelector<HTMLElement>('.work-visual')!;
    visual.addEventListener('pointermove', event => {
      if (!desktop.matches || reduced.matches || event.pointerType !== 'mouse') return;
      const rect = visual.getBoundingClientRect();
      visual.style.setProperty('--tilt-x', `${((.5 - (event.clientY - rect.top) / rect.height) * 3).toFixed(2)}deg`);
      visual.style.setProperty('--tilt-y', `${(((event.clientX - rect.left) / rect.width - .5) * 3).toFixed(2)}deg`);
    }, { passive: true });
    visual.addEventListener('pointerleave', () => { visual.style.removeProperty('--tilt-x'); visual.style.removeProperty('--tilt-y'); });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { rootMargin: '100px' }).observe(work);
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); reveals.unobserve(entry.target); }
    }), { threshold: .12 });
    cards.forEach(card => reveals.observe(card));
    new IntersectionObserver(([entry]) => { videoVisible = entry.isIntersecting; updateVideo(); }, { threshold: .1 }).observe(video);
    work.classList.add('work-ready');
  } else { visible = true; cards.forEach(card => card.classList.add('is-revealed')); }
  new ResizeObserver(measure).observe(work);
  addEventListener('resize', measure, { passive: true });
  addEventListener('scroll', schedule, { passive: true });
  // Reveal focused sheets for keyboard users, but release them when scrolling
  // with the mouse so returning focus from a dialog cannot cover the next sheet.
  addEventListener('keydown', event => {
    if (event.key === 'Tab') work.classList.add('work-keyboard');
    if (['PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) work.classList.remove('work-keyboard');
  });
  const pointerNavigation = () => work.classList.remove('work-keyboard');
  addEventListener('wheel', pointerNavigation, { passive: true });
  addEventListener('pointerdown', pointerNavigation, { passive: true });
  reduced.addEventListener('change', measure);
  desktop.addEventListener('change', measure);
  document.addEventListener('visibilitychange', () => { updateVideo(); schedule(); });
  document.fonts.ready.then(measure);

  work.querySelectorAll<HTMLButtonElement>('.work-open').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const card = button.closest('.work-card')!;
      // The sheet already carries the summary and visual; the dialog adds the title, the notes and the repository link.
      const title = card.querySelector('h3')!.cloneNode(true) as HTMLElement;
      title.id = 'work-detail-title';
      const links = document.createElement('p');
      links.className = 'work-links';
      const repository = card.querySelector('.work-links a');
      if (repository) links.append(repository.cloneNode(true));
      summary.replaceChildren(title, links);
      dialog.querySelectorAll<HTMLElement>('[data-detail]').forEach(note => { note.hidden = note.dataset.detail !== button.dataset.project; });
      opener = button;
      document.documentElement.classList.add('work-modal-open');
      dialog.showModal(); dialog.scrollTop = 0; updateVideo();
    });
  });
  dialog.querySelector('.work-close')!.addEventListener('click', () => dialog.close());
  const outside = (event: PointerEvent | MouseEvent) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog && outside(event)) dialog.close(); backdropDown = false; });
  dialog.addEventListener('close', () => {
    summary.replaceChildren();
    document.documentElement.classList.remove('work-modal-open');
    opener?.focus({ preventScroll: true }); updateVideo(); schedule();
  });
  measure();
}
