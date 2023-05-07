import React, { PropsWithChildren } from 'react';
import clsx from 'clsx';
import marker from './icons/dragger.png';

export interface Pos {
  x: number;
  y: number;
}

interface DraggerProps {
  x: number;
  y?: number;
  value: number;
  onDrag(pos: {
    x: number;
    y: number;
  }): void;
  className?: string;
}

export default function Dragger({
  x, y = 0, value, onDrag, className, children,
}: PropsWithChildren<DraggerProps>) {
  const isSlider = !!(className === "slider");
  const zIndex = isSlider ? 5 : 1;
  const handleMouseDown = (e0: React.MouseEvent) => {
    const { screenX, screenY } = e0;

    const handleMouseMove = (e: MouseEvent) => {
      onDrag({
        x: e.screenX - screenX + x,
        y: e.screenY - screenY + y,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={clsx('dragger', className)}
      onMouseDown={(e) => {
        if (isSlider) return;
        handleMouseDown(e);
      }}
      role="slider"
      aria-valuenow={value}
      tabIndex={0}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: zIndex,
      }}
    >
      {isSlider ?
        <div className="slider-wrapper" onMouseDown={handleMouseDown}>
          <img src={marker} />
        </div>
        :
        <></>
      }
      {children}
    </div>
  );
}
