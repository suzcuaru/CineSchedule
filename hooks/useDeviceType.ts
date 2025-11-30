
import { useState, useEffect, useRef } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Explicitly check for Mobile OS
      const isMobileOS = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Explicitly check for Desktop OS (Windows, Macintosh, Linux)
      // Note: iPads with iPadOS 13+ often report as Macintosh, which is generally fine for 'Desktop' UI 
      // unless we specifically need touch controls, but here we prioritize layout.
      // However, to be safe, we rely on the absence of 'mobile' indicators + width for desktop-like tablets.
      
      if (!isMobileOS) {
        // If it's a Desktop OS (Mouse/Keyboard primarily), ALWAYS return 'desktop'.
        // This allows resizing the browser to a narrow column (sidebar) without breaking the desktop UI features.
        setDeviceType('desktop');
        return;
      }

      // If it IS a mobile OS, switch layout based on screen width
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width >= 768 && width < 1280) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop'); // Large tablets/iPad Pro
      }
    };

    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Debounce resize event
      timeoutRef.current = setTimeout(checkDevice, 150);
    };

    // Initial check
    checkDevice();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return deviceType;
};
