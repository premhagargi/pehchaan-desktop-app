import React, { useState, useEffect } from 'react';
import { ProjectItem } from './types';
import { db } from './services/db';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { CreateProjectModal } from './components/dashboard/CreateProjectModal';
import { ImportPanel } from './components/import/ImportPanel';
import { RecordsPanel } from './components/records/RecordsPanel';
import { PhotosPanel } from './components/photos/PhotosPanel';
import { DesignerPanel } from './components/templates/DesignerPanel';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { GenerationPanel } from './components/generation/GenerationPanel';
import { ExportPanel } from './components/export/ExportPanel';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const refreshProjects = () => {
    const list = db.getProjects();
    setProjects(list);
    if (!activeProject && list.length > 0) {
      setActiveProject(list[0]);
    } else if (activeProject) {
      const updated = list.find((p) => p.id === activeProject.id);
      if (updated) setActiveProject(updated);
      else setActiveProject(list[0] || null);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const handleCreateProject = (name: string, type: any, description: string) => {
    const newProj = db.createProject(name, type, description);
    refreshProjects();
    setActiveProject(newProj);
    setActiveTab('records');
  };

  const handleSelectProject = (proj: ProjectItem) => {
    setActiveProject(proj);
    setActiveTab('records');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onNewProject={() => setIsCreateModalOpen(true)}
      />

      <main className={activeTab === 'templates' ? 'flex-1 overflow-hidden' : 'flex-1 pb-16'}>
        {activeTab === 'dashboard' && (
          <Dashboard
            projects={projects}
            onSelectProject={handleSelectProject}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRefresh={refreshProjects}
          />
        )}

        {activeTab === 'import' && activeProject && (
          <ImportPanel
            project={activeProject}
            onImportComplete={() => {
              refreshProjects();
              setActiveTab('records');
            }}
          />
        )}

        {activeTab === 'records' && activeProject && (
          <RecordsPanel project={activeProject} onRefresh={refreshProjects} />
        )}

        {activeTab === 'photos' && activeProject && (
          <PhotosPanel project={activeProject} onRefresh={refreshProjects} />
        )}

        {activeTab === 'templates' && activeProject && (
          <DesignerPanel project={activeProject} onRefresh={refreshProjects} />
        )}

        {activeTab === 'preview' && activeProject && (
          <PreviewPanel project={activeProject} />
        )}

        {activeTab === 'generation' && activeProject && (
          <GenerationPanel project={activeProject} />
        )}

        {activeTab === 'export' && activeProject && (
          <ExportPanel project={activeProject} />
        )}
      </main>

      {/* Footer info bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 border-t border-slate-800/80 py-2 px-6 backdrop-blur text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Offline Engine
          </span>
          <span>Local Storage: Active</span>
          {activeProject && (
            <span className="text-slate-300 font-medium">
              Project: {activeProject.name} ({activeProject.projectType})
            </span>
          )}
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          Pehchaan Desktop v1.0.0
        </div>
      </footer>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};
