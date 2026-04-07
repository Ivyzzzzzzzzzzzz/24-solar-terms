import React from 'react';

const annularGuidePath = (cx, cy, rOuter, rInner, startDeg, endDeg) => {
  const a0 = ((startDeg - 90) * Math.PI) / 180;
  const a1 = ((endDeg - 90) * Math.PI) / 180;
  const x0 = cx + Math.cos(a0) * rOuter;
  const y0 = cy + Math.sin(a0) * rOuter;
  const x1 = cx + Math.cos(a1) * rOuter;
  const y1 = cy + Math.sin(a1) * rOuter;
  const x2 = cx + Math.cos(a1) * rInner;
  const y2 = cy + Math.sin(a1) * rInner;
  const x3 = cx + Math.cos(a0) * rInner;
  const y3 = cy + Math.sin(a0) * rInner;
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

  return [
    `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    'Z'
  ].join(' ');
};

const TermMenuRing = ({ menuItems, menuRotation, activeMenu, alignMenuToTop, menuRingColor, onHoverChange }) => {
  const selectorPath = annularGuidePath(84, 84, 108, 78, -43, 43);
  const setHover = (next) => {
    if (onHoverChange) onHoverChange(next);
  };

  return (
    <div
      className="term-menu-ring"
      aria-label="Term menu"
      style={{ '--term-menu-ring-color': menuRingColor || '#ffffff' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHover(false);
      }}
    >
      <svg className="term-menu-selector-svg" viewBox="0 0 168 168" aria-hidden="true">
        <path className="term-menu-selector-box" d={selectorPath} />
      </svg>

      <div className="term-menu-wheel" style={{ transform: `rotate(${menuRotation}deg)` }}>
        <svg className="term-menu-svg" viewBox="0 0 168 168" role="img" aria-label="Term menu ring">
          <defs>
            <path id="termMenuTrackPath" d="M 84 2 A 82 82 0 1 1 84 166 A 82 82 0 1 1 84 2 A 82 82 0 1 1 84 166 A 82 82 0 1 1 84 2" fill="none" />
          </defs>

          {menuItems.map((item, index) => {
            const isActive = activeMenu === item.key;
            const labelOffset = ((50 - (index * 12.5)) + 100) % 100;
            return (
              <text
                key={item.key}
                className={`term-menu-path-label${isActive ? ' is-active' : ''}`}
                onClick={() => alignMenuToTop(index)}
                role="button"
                tabIndex={0}
                aria-label={`${item.en} menu`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alignMenuToTop(index);
                  }
                }}
              >
                <textPath href="#termMenuTrackPath" startOffset={`${labelOffset}%`} textAnchor="middle">
                  <tspan className="term-menu-path-zh">{item.zh}</tspan>
                  <tspan className="term-menu-path-gap"> </tspan>
                  <tspan className="term-menu-path-en">{item.en}</tspan>
                </textPath>
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default TermMenuRing;
