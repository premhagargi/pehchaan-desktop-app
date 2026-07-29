import React from 'react';
import { ProjectItem } from '../../types';
import {
  ShieldCheck,
  FolderOpen,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Image,
  Layout,
  Eye,
  Cpu,
  Printer,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  onSelectProject: (proj: ProjectItem) => void;
  onNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import', label: '1. Import Data', icon: FileSpreadsheet, disabled: !activeProject },
    { id: 'records', label: '2. Records', icon: Users, disabled: !activeProject },
    { id: 'photos', label: '3. Photos', icon: Image, disabled: !activeProject },
    { id: 'templates', label: '4. Designer', icon: Layout, disabled: !activeProject },
    { id: 'preview', label: '5. Preview', icon: Eye, disabled: !activeProject },
    { id: 'generation', label: '6. Generate', icon: Cpu, disabled: !activeProject },
    { id: 'export', label: '7. Imposition & Export', icon: Printer, disabled: !activeProject },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-lg text-white tracking-wide">pehchaan</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Offline CPU Engine
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Bulk ID Card & Document Generator</p>
          </div>
        </div>

        {/* Active Project Switcher */}
        <div className="relative group shrink-0">
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 transition-colors">
            <FolderOpen className="w-4 h-4 text-sky-400" />
            <span className="max-w-[160px] truncate">{activeProject ? activeProject.name : 'Select Project'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projects</div>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${activeProject?.id === p.id ? 'text-sky-400 font-semibold bg-sky-500/10' : 'text-slate-300'}`}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-950">{p.projectType}</span>
              </button>
            ))}
            <div className="border-t border-slate-800 my-1"></div>
            <button
              onClick={onNewProject}
              className="w-full text-left px-3 py-1.5 text-xs text-sky-400 font-medium hover:bg-slate-800 flex items-center gap-1.5"
            >
              + Create New Project
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 font-semibold'
                    : tab.disabled
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
