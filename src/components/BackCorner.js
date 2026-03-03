import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BackCorner = () => {
  const navigate = useNavigate();
  const [isUnfolding, setIsUnfolding] = useState(false);
  const cornerRef = useRef(null);
  const draggingRef = useRef(false);
  const unfoldingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const baseSize = 110;

  const getThreshold = () => Math.min(window.innerWidth, window.innerHeight) * 0.5;
  const getMaxSize = () => Math.max(window.innerWidth, window.innerHeight) * 1.15;

  const setSize = (size) => {
    if (cornerRef.current) {
      cornerRef.current.style.setProperty('--fold-size', `${size}px`);
    }
  };

  useEffect(() => {
    setSize(baseSize);
  }, []);

  const handleMove = (event) => {
    if (!draggingRef.current || unfoldingRef.current) return;

    const dx = Math.max(0, event.clientX - startXRef.current);
    const dy = Math.max(0, event.clientY - startYRef.current);
    const dist = Math.max(dx, dy);
    const threshold = getThreshold();
    const progress = Math.min(1, dist / threshold);
    const size = baseSize + progress * (threshold - baseSize);

    setSize(size);

    if (progress >= 1) {
      unfoldingRef.current = true;
      setIsUnfolding(true);

      if (cornerRef.current) {
        cornerRef.current.classList.remove('is-dragging');
        cornerRef.current.classList.add('is-unfolding');
      }

      setSize(getMaxSize());

      setTimeout(() => {
        const idx = window.history?.state?.idx;
        if (typeof idx === 'number' && idx > 0) navigate(-1);
        else navigate('/');
      }, 560);
    }
  };

  const handleEnd = () => {
    if (!draggingRef.current || unfoldingRef.current) return;
    draggingRef.current = false;

    if (cornerRef.current) {
      cornerRef.current.classList.remove('is-dragging');
    }

    setSize(baseSize);
  };

  const handlePointerDown = (event) => {
    if (unfoldingRef.current) return;

    draggingRef.current = true;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;

    if (cornerRef.current) {
      cornerRef.current.classList.add('is-dragging');
      cornerRef.current.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerUp = (event) => {
    if (cornerRef.current && event.pointerId !== undefined) {
      try {
        cornerRef.current.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }
    handleEnd();
  };

  const handlePointerCancel = (event) => {
    if (cornerRef.current && event.pointerId !== undefined) {
      try {
        cornerRef.current.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }
    handleEnd();
  };

  useEffect(() => {
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
    };
    // These handlers intentionally close over refs/state and are wired once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={cornerRef}
      className={`term-back-corner ${isUnfolding ? 'is-unfolding' : ''}`}
      id="termBackCorner"
      role="button"
      tabIndex={0}
      aria-label="Drag to return to previous page"
      onPointerDown={handlePointerDown}
      onPointerMove={handleMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <span className="term-back-corner-text">Back</span>
    </div>
  );
};

export default BackCorner;
