import React, { useState } from 'react';
import { ProjectItem } from '../../types';
import { db } from '../../services/db';
import {
  FolderPlus,
  Search,
  Users,
  Image,
  Layout,
  ArrowRight,
  Trash2,
  HardDrive,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  projects: ProjectItem[];
  onSelectProject: (proj: ProjectItem) => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onSelectProject,
  onOpenCreateModal,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project and all its records?')) {
      db.deleteProject(id);
      onRefresh();
    }
  };

  const handleResetDemo = () => {
    if (confirm('Reset database to default sample project?')) {
      db.resetToDemo();
      onRefresh();
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            Projects Overview
            <span className="text-xs font-normal text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage bulk ID card, badge, and certificate generation projects stored on your local disk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Reload Sample Demo Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>

          <button
            onClick={onOpenCreateModal}
            className="gradient-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
          >
            <FolderPlus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Local Storage System Info Box */}
      <div className="glass-panel p-4 rounded-2xl mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Local Storage & CPU Execution</h4>
            <p className="text-[11px] text-slate-400">
              All records, photos, templates, and rendered PDFs run entirely offline inside your local app directory.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-emerald-400 font-mono font-medium">100% Offline Ready</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search projects..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-800">
          <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create your first bulk document project to get started.</p>
          <button
            onClick={onOpenCreateModal}
            className="gradient-button px-4 py-2 rounded-xl text-xs font-semibold text-white"
          >
            Create New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const records = db.getRecords(p.id);
            const photos = db.getPhotos(p.id);
            const templates = db.getTemplates(p.id);
            const matchedPhotos = photos.filter(ph => ph.status === 'CONFIRMED' || ph.status === 'AUTO_MATCHED').length;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className="glass-card rounded-2xl p-5 cursor-pointer relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                      {p.projectType.replace('_', ' ')}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-display font-bold text-white group-hover:text-sky-400 transition-colors mb-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  {/* Stats pill list */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                        <Users className="w-3 h-3 text-sky-400" />
                        <span className="text-[10px]">Records</span>
                      </div>
                      <span className="text-xs font-bold text-white">{records.length}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                        <Image className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px]">Photos</span>
                      </div>
                      <span className="text-xs font-bold text-white">{matchedPhotos}/{photos.length}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                        <Layout className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px]">Templates</span>
                      </div>
                      <span className="text-xs font-bold text-white">{templates.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-sky-400 transition-colors pt-2 border-t border-slate-800/60">
                    <span>Open Project Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
