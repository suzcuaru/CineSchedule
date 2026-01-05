import React from 'react';
import { Terminal } from 'lucide-react';
import { ViewContainer } from './SystemUI';

export const RemoteControlView: React.FC = () => {
    return (
        <ViewContainer title="Пульт управления" icon={Terminal}>
             <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                 <Terminal size={48} className="mb-4 opacity-50" />
                 <p>Раздел в разработке</p>
             </div>
        </ViewContainer>
    );
};
