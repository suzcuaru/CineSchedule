
import React, { useEffect } from 'react';
import { useDeviceType } from './hooks/useDeviceType';
import { useAppLogic } from './hooks/useAppLogic';
import { MobileLayout } from './components/mobile/MobileLayout';
import { TabletLayout } from './components/tablet/TabletLayout';
import { DesktopLayout } from './components/desktop/DesktopLayout';

const App: React.FC = () => {
  // 1. Detect Device
  const device = useDeviceType();
  
  // 2. Load Core Logic (State, Data Fetching)
  const appLogic = useAppLogic();

  // 3. Apply Global Styles from Settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme
    root.dataset.theme = appLogic.appSettings.theme;

    // Set font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${appLogic.appSettings.fontSize}`);

    // Set animations
    if (appLogic.appSettings.enableAnimations) {
        root.classList.remove('animations-disabled');
    } else {
        root.classList.add('animations-disabled');
    }

  }, [appLogic.appSettings.theme, appLogic.appSettings.fontSize, appLogic.appSettings.enableAnimations]);


  // 4. Render Specific Layout
  if (device === 'mobile') {
      return <MobileLayout {...appLogic} />;
  }

  if (device === 'tablet') {
      return <TabletLayout {...appLogic} />;
  }

  return <DesktopLayout {...appLogic} />;
};

export default App;