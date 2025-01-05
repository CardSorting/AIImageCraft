import { useEffect, useRef } from 'react';

interface CardEffectSettings {
  tiltEffectMaxRotation: number;
  tiltEffectPerspective: number;
  tiltEffectScale: number;
  shineMovementRange: number;
  rainbowShineMovementRange: number;
}

const defaultSettings: CardEffectSettings = {
  tiltEffectMaxRotation: 15,
  tiltEffectPerspective: 800,
  tiltEffectScale: 1.05,
  shineMovementRange: 100,
  rainbowShineMovementRange: 50,
};

export function use3DCardEffect(settings: Partial<CardEffectSettings> = {}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const rainbowShineRef = useRef<HTMLDivElement>(null);
  const effectSettings = { ...defaultSettings, ...settings };

  useEffect(() => {
    const card = cardRef.current;
    const shine = shineRef.current;
    const rainbowShine = rainbowShineRef.current;

    if (!card || !shine || !rainbowShine) return;

    const setTransition = (active: boolean) => {
      const transition = active ? 'all 0.5s ease-out' : 'none';
      card.style.transition = transition;
      shine.style.transition = transition;
      rainbowShine.style.transition = transition;
    };

    const updateShineEffect = (
      element: HTMLDivElement,
      angleX: number,
      angleY: number,
      range: number
    ) => {
      const x = -angleX * range;
      const y = -angleY * range;
      element.style.transform = `translate(${x}%, ${y}%)`;
      element.style.opacity = '1';
    };

    const resetTilt = () => {
      setTransition(true);
      card.style.transform = `
        perspective(${effectSettings.tiltEffectPerspective}px)
        rotateX(0deg)
        rotateY(0deg)
        scale3d(1, 1, 1)
      `;
      shine.style.transform = 'translate(0%, 0%)';
      shine.style.opacity = '0';
      rainbowShine.style.transform = 'translate(0%, 0%)';
      rainbowShine.style.opacity = '0';
    };

    const handleTilt = (e: MouseEvent) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const angleX = (e.clientX - (left + width / 2)) / (width / 2);
      const angleY = (e.clientY - (top + height / 2)) / (height / 2);

      const rotateX = angleY * effectSettings.tiltEffectMaxRotation;
      const rotateY = -angleX * effectSettings.tiltEffectMaxRotation;

      card.style.transform = `
        perspective(${effectSettings.tiltEffectPerspective}px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(${effectSettings.tiltEffectScale}, ${effectSettings.tiltEffectScale}, ${effectSettings.tiltEffectScale})
      `;

      updateShineEffect(shine, angleX, angleY, effectSettings.shineMovementRange);
      updateShineEffect(rainbowShine, angleX, angleY, effectSettings.rainbowShineMovementRange);
    };

    card.addEventListener('mouseenter', () => setTransition(false));
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);

    return () => {
      card.removeEventListener('mouseenter', () => setTransition(false));
      card.removeEventListener('mousemove', handleTilt);
      card.removeEventListener('mouseleave', resetTilt);
    };
  }, [effectSettings]);

  return { cardRef, shineRef, rainbowShineRef };
}
