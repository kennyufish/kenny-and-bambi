document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealItems = document.querySelectorAll(".reveal");

  if (motionQuery.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Short loops marked data-autoplay play only while visible, and never under reduced motion.
  document.querySelectorAll("video[data-autoplay]").forEach((video) => {
    let visible = !("IntersectionObserver" in window);
    const sync = () => {
      if (visible && !motionQuery.matches && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.1 }).observe(video);
    }
    document.addEventListener("visibilitychange", sync);
    if (typeof motionQuery.addEventListener === "function") motionQuery.addEventListener("change", sync);
    sync();
  });

  const scene = document.querySelector("#studio-scene");
  const catHead = document.querySelector("#cat-head");

  if (!scene || !catHead) return;

  const catCenter = { x: 736, y: 164 };
  const target = { x: 0, y: 0, rotation: 0 };
  const current = { ...target };
  let lastPointerAt = 0;
  let animationFrame = 0;
  let sceneVisible = true;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;

  const pointInScene = (event) => {
    const matrix = scene.getScreenCTM();
    if (!matrix) return null;

    const point = scene.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse());
  };

  const followPointer = (event) => {
    if (motionQuery.matches) return;

    const point = pointInScene(event);
    if (!point) return;

    const deltaX = point.x - catCenter.x;
    const deltaY = point.y - catCenter.y;
    target.x = clamp(deltaX * 0.008, -2.4, 2.4);
    target.y = clamp(deltaY * 0.008, -2.4, 2.4);
    target.rotation = 0;
    lastPointerAt = performance.now();
  };

  const setIdleTarget = (time) => {
    const slowLook = Math.sin(time / 1550);
    const quickCheck = Math.sin(time / 6100);
    target.x = slowLook * 2.2 + quickCheck * 0.8;
    target.y = Math.sin(time / 2100) * 1.1;
    target.rotation = 0;
  };

  const resetCat = () => {
    Object.keys(target).forEach((key) => {
      target[key] = 0;
      current[key] = 0;
    });
    catHead.style.transform = "";
  };

  const renderCat = (time) => {
    if (!sceneVisible || document.hidden) {
      animationFrame = 0;
      return;
    }

    if (time - lastPointerAt > 1800) setIdleTarget(time);

    Object.keys(current).forEach((key) => {
      current[key] = lerp(current[key], target[key], 0.085);
    });

    catHead.style.transform =
      `translate(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px) rotate(${current.rotation.toFixed(2)}deg)`;

    animationFrame = requestAnimationFrame(renderCat);
  };

  const startMotion = () => {
    if (animationFrame || motionQuery.matches || !sceneVisible || document.hidden) return;
    lastPointerAt = performance.now();
    animationFrame = requestAnimationFrame(renderCat);
  };

  const pauseMotion = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const stopMotion = () => {
    pauseMotion();
    resetCat();
  };

  document.addEventListener("pointermove", followPointer, { passive: true });

  if ("IntersectionObserver" in window) {
    const sceneObserver = new IntersectionObserver(
      ([entry]) => {
        sceneVisible = entry.isIntersecting;
        if (sceneVisible) {
          startMotion();
        } else {
          pauseMotion();
        }
      },
      { rootMargin: "20% 0px" }
    );
    sceneObserver.observe(scene);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseMotion();
    } else {
      startMotion();
    }
  });

  const handleMotionPreference = () => {
    if (motionQuery.matches) {
      stopMotion();
    } else {
      startMotion();
    }
  };

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", handleMotionPreference);
  } else {
    motionQuery.addListener(handleMotionPreference);
  }

  handleMotionPreference();
});
