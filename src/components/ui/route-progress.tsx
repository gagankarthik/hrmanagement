'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

export function RouteProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setVisible(true);
    setProgress(8);

    const t1 = setTimeout(() => setProgress(45), 60);
    const t2 = setTimeout(() => setProgress(80), 200);
    const t3 = setTimeout(() => setProgress(100), 380);
    const t4 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5"
    >
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-[width,opacity] ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionDuration: progress === 100 ? '180ms' : '320ms',
        }}
      />
    </div>
  );
}
