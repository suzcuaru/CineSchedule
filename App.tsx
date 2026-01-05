
import React, { useEffect } from 'react';
import { useDeviceType } from './hooks/useDeviceType';
import { useAppLogic } from './hooks/useAppLogic';
import { MobileLayout } from './components/mobile/MobileLayout';
import { TabletLayout } from './components/tablet/TabletLayout';
import { DesktopLayout } from './components/desktop/DesktopLayout';

const App: React.FC = () => {
  const device = useDeviceType();
  const appLogic = useAppLogic();

  useEffect(() => {
    const root = document.documentElement;
    
    // Применяем тему к html для CSS переменных
    root.dataset.theme = appLogic.appSettings.theme;

    // Применяем размер шрифта к html элементу
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${appLogic.appSettings.fontSize}`);

    // Управление анимациями
    if (appLogic.appSettings.enableAnimations) {
        root.classList.remove('animations-disabled');
    } else {
        root.classList.add('animations-disabled');
    }

  }, [appLogic.appSettings.theme, appLogic.appSettings.fontSize, appLogic.appSettings.enableAnimations]);


  if (device === 'mobile') {
      return <MobileLayout {...appLogic} />;
  }

  if (device === 'tablet') {
      return <TabletLayout {...appLogic} />;
  }

  return <DesktopLayout {...appLogic} />;
};

export default App;
