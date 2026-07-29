import {
  ProjectItem,
  FieldDefinition,
  RecordItem,
  PhotoItem,
  TemplateItem,
  PrintProfileItem,
} from '../types';

const STORAGE_KEY = 'pehchaan_local_db_v1';

export interface DatabaseSchema {
  projects: ProjectItem[];
  fields: Record<string, FieldDefinition[]>; // projectId -> fields
  records: Record<string, RecordItem[]>;     // projectId -> records
  photos: Record<string, PhotoItem[]>;       // projectId -> photos
  templates: Record<string, TemplateItem[]>; // projectId -> templates
  printProfiles: PrintProfileItem[];
}

function getInitialState(): DatabaseSchema {
  const sampleProjectId = 'demo-school-id';
  
  const demoProject: ProjectItem = {
    id: sampleProjectId,
    name: 'St. Xavier High School 2026',
    projectType: 'ID_CARD',
    description: 'Student & Staff Smart ID Cards with QR & Barcode',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoFields: FieldDefinition[] = [
    { id: 'f1', projectId: sampleProjectId, key: 'name', label: 'Full Name', type: 'TEXT', isRequired: true, isUnique: false, order: 1 },
    { id: 'f2', projectId: sampleProjectId, key: 'roll_no', label: 'Roll / Admin No', type: 'TEXT', isRequired: true, isUnique: true, order: 2 },
    { id: 'f3', projectId: sampleProjectId, key: 'class', label: 'Class & Sec', type: 'TEXT', isRequired: false, isUnique: false, order: 3 },
    { id: 'f4', projectId: sampleProjectId, key: 'dob', label: 'Date of Birth', type: 'DATE', isRequired: false, isUnique: false, order: 4 },
    { id: 'f5', projectId: sampleProjectId, key: 'blood_group', label: 'Blood Group', type: 'TEXT', isRequired: false, isUnique: false, order: 5 },
    { id: 'f6', projectId: sampleProjectId, key: 'emergency_contact', label: 'Emergency Contact', type: 'PHONE', isRequired: false, isUnique: false, order: 6 },
    { id: 'f7', projectId: sampleProjectId, key: 'photo', label: 'Photo Ref', type: 'PHOTO_REF', isRequired: false, isUnique: false, order: 7 },
  ];

  const demoRecords: RecordItem[] = [
    {
      id: 'rec-1',
      projectId: sampleProjectId,
      recordData: {
        name: 'Aarav Sharma',
        roll_no: 'ST-2026-001',
        class: 'Class 10-A',
        dob: '2010-05-14',
        blood_group: 'O+',
        emergency_contact: '+91 98765 43210',
        photo: 'photo-aarav.jpg',
      },
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-2',
      projectId: sampleProjectId,
      recordData: {
        name: 'Ananya Verma',
        roll_no: 'ST-2026-002',
        class: 'Class 10-A',
        dob: '2010-08-22',
        blood_group: 'B+',
        emergency_contact: '+91 98765 43211',
        photo: 'photo-ananya.jpg',
      },
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-3',
      projectId: sampleProjectId,
      recordData: {
        name: 'Rohan Gupta',
        roll_no: 'ST-2026-003',
        class: 'Class 10-B',
        dob: '2010-11-03',
        blood_group: 'A+',
        emergency_contact: '+91 98765 43212',
        photo: '',
      },
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-4',
      projectId: sampleProjectId,
      recordData: {
        name: 'Priya Sundaram',
        roll_no: 'ST-2026-004',
        class: 'Class 10-B',
        dob: '2010-02-18',
        blood_group: 'AB+',
        emergency_contact: '+91 98765 43213',
        photo: 'photo-priya.jpg',
      },
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const demoPhotos: PhotoItem[] = [
    {
      id: 'ph-1',
      projectId: sampleProjectId,
      recordId: 'rec-1',
      originalFilename: 'photo-aarav.jpg',
      dataUrl: createSampleAvatarSvg('Aarav Sharma', '#3b82f6'),
      matchConfidence: 1.0,
      matchMethod: 'EXACT_FILENAME',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ph-2',
      projectId: sampleProjectId,
      recordId: 'rec-2',
      originalFilename: 'photo-ananya.jpg',
      dataUrl: createSampleAvatarSvg('Ananya Verma', '#ec4899'),
      matchConfidence: 1.0,
      matchMethod: 'EXACT_FILENAME',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ph-4',
      projectId: sampleProjectId,
      recordId: 'rec-4',
      originalFilename: 'photo-priya.jpg',
      dataUrl: createSampleAvatarSvg('Priya Sundaram', '#8b5cf6'),
      matchConfidence: 1.0,
      matchMethod: 'EXACT_FILENAME',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
  ];

  const demoTemplate: TemplateItem = {
    id: 'tmpl-1',
    projectId: sampleProjectId,
    name: 'Modern Blue Student Card',
    cardWidthMm: 85.6,
    cardHeightMm: 53.98,
    dpi: 300,
    backgroundColor: '#0f172a',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sceneGraph: [
      // Top Header bar
      {
        id: 'header-bg',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 85.6,
        height: 14,
        rotation: 0,
        opacity: 1,
        fill: '#1e3a8a',
      },
      // School Name Header
      {
        id: 'header-title',
        type: 'text',
        x: 42.8,
        y: 4,
        width: 80,
        height: 5,
        rotation: 0,
        opacity: 1,
        text: 'ST. XAVIER HIGH SCHOOL',
        style: {
          fontSize: 8.5,
          fontFamily: 'Outfit',
          color: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
        },
      },
      {
        id: 'header-sub',
        type: 'text',
        x: 42.8,
        y: 9.5,
        width: 80,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'STUDENT IDENTITY CARD — 2026',
        style: {
          fontSize: 4.5,
          fontFamily: 'Inter',
          color: '#93c5fd',
          align: 'center',
          fontWeight: 'bold',
        },
      },
      // Photo Placeholder Frame
      {
        id: 'photo-frame',
        type: 'photo_placeholder',
        x: 6,
        y: 17,
        width: 24,
        height: 29,
        rotation: 0,
        opacity: 1,
        fill: '#1e293b',
        stroke: '#3b82f6',
        strokeWidth: 0.5,
        binding: 'photo',
      },
      // Name
      {
        id: 'txt-name',
        type: 'text',
        x: 34,
        y: 18,
        width: 48,
        height: 6,
        rotation: 0,
        opacity: 1,
        binding: 'name',
        style: {
          fontSize: 9,
          fontFamily: 'Outfit',
          color: '#ffffff',
          align: 'left',
          fontWeight: 'bold',
        },
      },
      // Roll No
      {
        id: 'txt-roll',
        type: 'text',
        x: 34,
        y: 25,
        width: 48,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'ID: {{roll_no}}',
        style: {
          fontSize: 6.5,
          fontFamily: 'JetBrains Mono',
          color: '#38bdf8',
          align: 'left',
          fontWeight: 'bold',
        },
      },
      // Class
      {
        id: 'txt-class',
        type: 'text',
        x: 34,
        y: 30,
        width: 48,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'Class: {{class}}',
        style: {
          fontSize: 6,
          fontFamily: 'Inter',
          color: '#cbd5e1',
          align: 'left',
        },
      },
      // DOB & Blood
      {
        id: 'txt-dob',
        type: 'text',
        x: 34,
        y: 34.5,
        width: 48,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'DOB: {{dob}}  |  Blood: {{blood_group}}',
        style: {
          fontSize: 5.5,
          fontFamily: 'Inter',
          color: '#94a3b8',
          align: 'left',
        },
      },
      // Emergency Contact
      {
        id: 'txt-emergency',
        type: 'text',
        x: 34,
        y: 39,
        width: 48,
        height: 4,
        rotation: 0,
        opacity: 1,
        text: 'Emergency: {{emergency_contact}}',
        style: {
          fontSize: 5,
          fontFamily: 'Inter',
          color: '#94a3b8',
          align: 'left',
        },
      },
      // Barcode / QR Code
      {
        id: 'barcode-qr',
        type: 'barcode',
        x: 68,
        y: 28,
        width: 13,
        height: 13,
        rotation: 0,
        opacity: 1,
        binding: 'roll_no',
        barcode: {
          symbology: 'qrcode',
          includeText: false,
        },
      },
      // Bottom accent bar
      {
        id: 'footer-bg',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 49.98,
        width: 85.6,
        height: 4,
        rotation: 0,
        opacity: 1,
        fill: '#2563eb',
      },
    ],
    sceneGraphBack: [
      {
        id: 'back-header',
        type: 'text',
        x: 42.8,
        y: 10,
        width: 80,
        height: 6,
        rotation: 0,
        opacity: 1,
        text: 'TERMS & CONDITIONS',
        style: {
          fontSize: 8,
          fontFamily: 'Outfit',
          color: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
        },
      },
      {
        id: 'back-body',
        type: 'text',
        x: 42.8,
        y: 20,
        width: 75,
        height: 25,
        rotation: 0,
        opacity: 1,
        text: '1. This card is property of St. Xavier High School.\n2. If found, please return to school administration office.\n3. Loss of card must be reported immediately.',
        style: {
          fontSize: 5,
          fontFamily: 'Inter',
          color: '#94a3b8',
          align: 'center',
        },
      },
    ],
  };

  const demoPrintProfile: PrintProfileItem = {
    id: 'pp-12x18-10up',
    name: '12×18 Sheet — 10-Up Cut-Stack Transpose',
    sheetWidthMm: 304.8,  // 12 inches
    sheetHeightMm: 457.2, // 18 inches
    cardTrimWidthMm: 85.6,
    cardTrimHeightMm: 53.98,
    bleedMm: 2,
    safeZoneMm: 2,
    rows: 5,
    cols: 2,
    marginTopMm: 15,
    marginBottomMm: 15,
    marginLeftMm: 15,
    marginRightMm: 15,
    gutterXMm: 5,
    gutterYMm: 5,
    cropMarkStyle: 'CORNER',
    positionOrder: 'ROW_MAJOR',
    impositionMode: 'CUT_STACK_TRANSPOSE',
    createdAt: new Date().toISOString(),
  };

  return {
    projects: [demoProject],
    fields: { [sampleProjectId]: demoFields },
    records: { [sampleProjectId]: demoRecords },
    photos: { [sampleProjectId]: demoPhotos },
    templates: { [sampleProjectId]: [demoTemplate] },
    printProfiles: [demoPrintProfile],
  };
}

function createSampleAvatarSvg(name: string, bgHex: string): string {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360">
    <rect width="300" height="360" fill="${bgHex}" />
    <circle cx="150" cy="140" r="70" fill="rgba(255,255,255,0.2)" />
    <path d="M 50 360 C 50 240, 250 240, 250 360 Z" fill="rgba(255,255,255,0.2)" />
    <text x="150" y="160" font-family="sans-serif" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

class LocalDB {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load DB from localStorage:', e);
    }
    const initial = getInitialState();
    this.save(initial);
    return initial;
  }

  private save(data?: DatabaseSchema) {
    if (data) this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      // If running inside Electron, also async persist to disk
      if ((window as any).electronAPI) {
        (window as any).electronAPI.getStorageDir().then((dir: string) => {
          const fsPath = `${dir}/store.json`;
          (window as any).electronAPI.writeFile(fsPath, JSON.stringify(this.data, null, 2));
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save DB:', e);
    }
  }

  // Projects
  getProjects(): ProjectItem[] {
    return this.data.projects;
  }

  getProject(id: string): ProjectItem | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  createProject(name: string, projectType: ProjectItem['projectType'], description?: string): ProjectItem {
    const id = 'proj_' + Math.random().toString(36).substring(2, 9);
    const newProj: ProjectItem = {
      id,
      name,
      projectType,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.projects.unshift(newProj);
    this.data.fields[id] = [
      { id: 'f_' + Math.random().toString(36).substring(2, 7), projectId: id, key: 'name', label: 'Full Name', type: 'TEXT', isRequired: true, isUnique: false, order: 1 },
      { id: 'f_' + Math.random().toString(36).substring(2, 7), projectId: id, key: 'id_number', label: 'ID Number', type: 'TEXT', isRequired: true, isUnique: true, order: 2 },
      { id: 'f_' + Math.random().toString(36).substring(2, 7), projectId: id, key: 'photo', label: 'Photo Ref', type: 'PHOTO_REF', isRequired: false, isUnique: false, order: 3 },
    ];
    this.data.records[id] = [];
    this.data.photos[id] = [];
    
    // Default Template
    const defaultTemplate: TemplateItem = {
      id: 'tmpl_' + Math.random().toString(36).substring(2, 9),
      projectId: id,
      name: 'Standard Template',
      cardWidthMm: 85.6,
      cardHeightMm: 53.98,
      dpi: 300,
      backgroundColor: '#0f172a',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sceneGraph: [
        {
          id: 'title',
          type: 'text',
          x: 42.8,
          y: 6,
          width: 80,
          height: 6,
          rotation: 0,
          opacity: 1,
          text: name.toUpperCase(),
          style: { fontSize: 9, fontFamily: 'Outfit', color: '#38bdf8', align: 'center', fontWeight: 'bold' },
        },
        {
          id: 'photo-frame',
          type: 'photo_placeholder',
          x: 6,
          y: 15,
          width: 24,
          height: 30,
          rotation: 0,
          opacity: 1,
          fill: '#1e293b',
          stroke: '#38bdf8',
          strokeWidth: 0.5,
          binding: 'photo',
        },
        {
          id: 'txt-name',
          type: 'text',
          x: 34,
          y: 18,
          width: 48,
          height: 6,
          rotation: 0,
          opacity: 1,
          binding: 'name',
          style: { fontSize: 8.5, fontFamily: 'Outfit', color: '#ffffff', align: 'left', fontWeight: 'bold' },
        },
        {
          id: 'txt-id',
          type: 'text',
          x: 34,
          y: 26,
          width: 48,
          height: 4,
          rotation: 0,
          opacity: 1,
          text: 'ID: {{id_number}}',
          style: { fontSize: 6.5, fontFamily: 'JetBrains Mono', color: '#94a3b8', align: 'left' },
        },
      ],
    };
    this.data.templates[id] = [defaultTemplate];
    this.save();
    return newProj;
  }

  deleteProject(id: string) {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    delete this.data.fields[id];
    delete this.data.records[id];
    delete this.data.photos[id];
    delete this.data.templates[id];
    this.save();
  }

  // Fields
  getFields(projectId: string): FieldDefinition[] {
    return this.data.fields[projectId] || [];
  }

  saveFields(projectId: string, fields: FieldDefinition[]) {
    this.data.fields[projectId] = fields;
    this.save();
  }

  // Records
  getRecords(projectId: string): RecordItem[] {
    return this.data.records[projectId] || [];
  }

  saveRecords(projectId: string, records: RecordItem[]) {
    this.data.records[projectId] = records;
    this.save();
  }

  addRecord(projectId: string, recordData: Record<string, any>, quantity = 1): RecordItem {
    const newRec: RecordItem = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      projectId,
      recordData,
      quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!this.data.records[projectId]) this.data.records[projectId] = [];
    this.data.records[projectId].unshift(newRec);
    this.save();
    return newRec;
  }

  updateRecord(projectId: string, recordId: string, recordData: Record<string, any>, quantity?: number) {
    const list = this.data.records[projectId] || [];
    const idx = list.findIndex(r => r.id === recordId);
    if (idx !== -1) {
      list[idx].recordData = recordData;
      if (quantity !== undefined) list[idx].quantity = quantity;
      list[idx].updatedAt = new Date().toISOString();
      this.save();
    }
  }

  deleteRecord(projectId: string, recordId: string) {
    if (this.data.records[projectId]) {
      this.data.records[projectId] = this.data.records[projectId].filter(r => r.id !== recordId);
      this.save();
    }
  }

  // Photos
  getPhotos(projectId: string): PhotoItem[] {
    return this.data.photos[projectId] || [];
  }

  savePhotos(projectId: string, photos: PhotoItem[]) {
    this.data.photos[projectId] = photos;
    this.save();
  }

  addPhoto(projectId: string, filename: string, dataUrl: string, recordId: string | null = null): PhotoItem {
    const photo: PhotoItem = {
      id: 'ph_' + Math.random().toString(36).substring(2, 9),
      projectId,
      recordId,
      originalFilename: filename,
      dataUrl,
      matchConfidence: recordId ? 1.0 : null,
      matchMethod: recordId ? 'MANUAL' : null,
      status: recordId ? 'CONFIRMED' : 'PENDING',
      createdAt: new Date().toISOString(),
    };
    if (!this.data.photos[projectId]) this.data.photos[projectId] = [];
    this.data.photos[projectId].unshift(photo);
    this.save();
    return photo;
  }

  // Templates
  getTemplates(projectId: string): TemplateItem[] {
    return this.data.templates[projectId] || [];
  }

  saveTemplate(projectId: string, template: TemplateItem) {
    if (!this.data.templates[projectId]) this.data.templates[projectId] = [];
    const list = this.data.templates[projectId];
    const idx = list.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      list[idx] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      list.push(template);
    }
    this.save();
  }

  // Print Profiles
  getPrintProfiles(): PrintProfileItem[] {
    return this.data.printProfiles;
  }

  savePrintProfile(profile: PrintProfileItem) {
    const idx = this.data.printProfiles.findIndex(p => p.id === profile.id);
    if (idx !== -1) {
      this.data.printProfiles[idx] = profile;
    } else {
      this.data.printProfiles.push(profile);
    }
    this.save();
  }

  resetToDemo() {
    this.save(getInitialState());
  }
}

export const db = new LocalDB();
