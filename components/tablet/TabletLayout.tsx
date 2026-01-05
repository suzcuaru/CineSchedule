
import React, { Suspense } from 'react';
import { Navbar } from '../Navbar';
import { useAppLogic } from '../../hooks/useAppLogic';

const ScheduleGrid = React.lazy(() => import('../ScheduleGrid').then(module => ({ default: module.ScheduleGrid })));
const HallWeeklyView = React.lazy(() => import('../HallWeeklyView').then(module => ({ default: module.HallWeeklyView })));
const DashboardView = React.lazy(() => import('../system/DashboardView').then(module => ({ default: module.DashboardView })));
const ReleasesView = React.lazy(() => import('../system/ReleasesView').then(module => ({ default: module.ReleasesView })));
const RemoteControlView = React.lazy(() => import('../system/RemoteControlView').then(module => ({ default: module.RemoteControlView })));

const SettingsView = React.lazy(() => import('../system/SettingsView').then(module => ({ default: module.SettingsView })));
const HelpView = React.lazy(() => import('../system/HelpView').then(module => ({ default: module.HelpView })));
const UpdatesView = React.lazy(() => import('../system/UpdatesView').then(module => ({ default: module.UpdatesView })));

const CodeLoadFallback = () => <div className="w-full h-full bg-[#0b0f19]" />;

export const TabletLayout: React.FC<ReturnType<typeof useAppLogic>> = (props) => {
  const { 
      viewMode, appSettings, isLoading, currentDashboardSessions, 
      halls, handleHallClick, currentWeeklyHallSessions, 
      getWeeklyDates, currentDate, updateSetting, handleNavigate,
      selectedMovieName, handleSelectMovie, handleStatusChange, refreshKey
  } = props;

  const renderContent = () => {
      switch (viewMode.type) {
          case 'dashboard':
             return (
                  <DashboardView 
                    sessions={currentDashboardSessions}
                    onNavigate={handleNavigate}
                    date={currentDate}
                  />
              );
          case 'schedule':
              return (
                <ScheduleGrid 
                    sessions={currentDashboardSessions} 
                    halls={halls} 
                    onHallClick={handleHallClick}
                    settings={appSettings}
                    isLoading={isLoading}
                    columnWidthClass="w-[46vw] min-w-[325px]" 
                    selectedMovieName={selectedMovieName}
                    onSelectMovie={handleSelectMovie}
                    onStatusChange={handleStatusChange}
                    refreshKey={refreshKey}
                />
              );
          case 'releases':
              return <ReleasesView />;
          case 'remote_control':
              return <RemoteControlView />;
          case 'hall_weekly':
              return (
                <HallWeeklyView 
                    hallName={viewMode.hallName}
                    dates={getWeeklyDates(currentDate)}
                    sessions={currentWeeklyHallSessions}
                    settings={appSettings}
                    loading={isLoading}
                    columnWidthClass="w-[46vw] min-w-[325px]"
                    selectedMovieName={selectedMovieName}
                    onSelectMovie={handleSelectMovie}
                    onStatusChange={handleStatusChange}
                    updateSetting={updateSetting}
                    refreshKey={refreshKey}
                />
              );
          case 'settings': return <SettingsView settings={appSettings} onUpdate={updateSetting} />;
          case 'info': return <HelpView />;
          case 'updates': return <UpdatesView />;
          default: return null;
      }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0b0f19] text-slate-200 font-sans w-full overflow-hidden overscroll-none">
      <Navbar 
        {...props} 
        onNavigate={props.handleNavigate} 
        onRefresh={props.handleRefresh} 
      />
      <main className="flex-1 overflow-hidden relative bg-gradient-to-b from-[#0f172a] to-[#0b0f19] w-full">
         <div className={`h-full w-full flex flex-col ${viewMode.type === 'schedule' ? 'pt-4' : 'pt-0'}`}>
            <Suspense fallback={<CodeLoadFallback />}>
                {renderContent()}
            </Suspense>
        </div>
      </main>
    </div>
  );
};
