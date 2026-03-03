import React from 'react';

const TermMenuRing = ({ menuItems, menuRotation, menuSelectorPath, activeMenu, alignMenuToTop }) => {
  return (
    <div className="term-menu-ring" aria-label="Auto rotating term menu">
      <svg className="term-menu-selector-svg" viewBox="0 0 168 168" aria-hidden="true">
        <path className="term-menu-selector-box" d={menuSelectorPath} />
      </svg>

      <div className="term-menu-wheel" style={{ transform: `rotate(${menuRotation}deg)` }}>
        <svg className="term-menu-svg" viewBox="0 0 168 168" role="img" aria-label="Term menu ring">
          <defs>
            <path id="termMenuTrackPath" d="M 84 2 A 82 82 0 1 1 84 166 A 82 82 0 1 1 84 2 A 82 82 0 1 1 84 166 A 82 82 0 1 1 84 2" fill="none" />
          </defs>
          <path className="term-menu-ring-track" d="M 84 2 A 82 82 0 1 1 84 166 A 82 82 0 1 1 84 2" fill="none" />

          {menuItems.map((item, index) => {
            const isActive = activeMenu === item.key;
            const labelOffset = 50 + (index * 12.5);
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
