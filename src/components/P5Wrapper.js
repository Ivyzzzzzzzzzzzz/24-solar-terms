import React, { useEffect, useRef } from 'react';

const P5Wrapper = () => {
  const mountRef = useRef(null);
  const sketchRef = useRef(null);

  useEffect(() => {
    let trail = [];
    let maxTrailLength = 15;
    let pmouseX = 0;
    let pmouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;

    const easeOut = (t) => {
      return 1 - Math.pow(1 - t, 3);
    };

    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.pixelDensity(1);
        p.noCursor();
        smoothMouseX = p.mouseX;
        smoothMouseY = p.mouseY;
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      p.draw = () => {
        p.fill(246, 241, 234, 25);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          smoothMouseX = p.lerp(smoothMouseX, p.mouseX, 0.15);
          smoothMouseY = p.lerp(smoothMouseY, p.mouseY, 0.15);
        }

        const mouseMoved = (Math.abs(p.mouseX - pmouseX) > 0.5 || Math.abs(p.mouseY - pmouseY) > 0.5);

        if (mouseMoved) {
          if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            const distFromLast = trail.length > 0
              ? p.dist(smoothMouseX, smoothMouseY, trail[trail.length - 1].x, trail[trail.length - 1].y)
              : 100;

            if (distFromLast > 8) {
              trail.push({ x: smoothMouseX, y: smoothMouseY, age: 0 });
              if (trail.length > maxTrailLength) {
                trail.shift();
              }
            }
          }
        } else {
          if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height && trail.length > 0) {
            for (let i = 0; i < trail.length; i++) {
              const dx = smoothMouseX - trail[i].x;
              const dy = smoothMouseY - trail[i].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              const t = p.constrain(dist / 150, 0, 1);
              const ease = easeOut(t);
              const speed = p.map(ease, 0, 1, 0.08, 0.25);

              trail[i].x = p.lerp(trail[i].x, smoothMouseX, speed);
              trail[i].y = p.lerp(trail[i].y, smoothMouseY, speed);

              if (dist < 2) {
                trail.splice(i, 1);
                i--;
              }
            }

            if (trail.length > 2 && p.frameCount % 3 === 0) {
              trail.shift();
            }
          }
        }

        for (let i = 0; i < trail.length; i++) {
          trail[i].age += 1;
        }

        for (let i = 0; i < trail.length; i++) {
          const pt = trail[i];
          const ageFade = 1 - Math.min(1, pt.age / 120);
          const posAlpha = Math.pow(i / trail.length, 0.7);
          const alpha = ageFade * posAlpha * 255;

          const sizeFactor = Math.pow(i / trail.length, 0.5);
          const baseSize = p.map(i, 0, trail.length - 1, 2, 14);
          const size = baseSize * sizeFactor;

          p.noStroke();
          p.fill(30, 30, 30, alpha * 0.7);
          p.ellipse(pt.x, pt.y, size, size);
        }

        pmouseX = p.mouseX;
        pmouseY = p.mouseY;
      };
    };

    if (window.p5 && mountRef.current) {
      sketchRef.current = new window.p5(sketch, mountRef.current);
    }

    return () => {
      if (sketchRef.current) {
        sketchRef.current.remove();
      }
    };
  }, []);

  return <div ref={mountRef} id="p5Mount" aria-hidden="true"></div>;
};

export default P5Wrapper;
