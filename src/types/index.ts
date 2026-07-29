export type ProjectType = 'ID_CARD' | 'CERTIFICATE' | 'BADGE';

export type FieldType = 
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'PHONE'
  | 'EMAIL'
  | 'ENUM'
  | 'PHOTO_REF'
  | 'COMPUTED';

export interface FieldDefinition {
  id: string;
  projectId: string;
  key: string;        // machine name e.g. "student_name"
  label: string;      // display label e.g. "Student Name"
  type: FieldType;
  formatHint?: string;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: string;
  computedExpr?: string;
  order: number;
}

export interface RecordItem {
  id: string;
  projectId: string;
  recordData: Record<string, any>;
  quantity: number;
  isDuplicate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PhotoStatus = 
  | 'PENDING'
  | 'AUTO_MATCHED'
  | 'CONFIRMED'
  | 'MISSING'
  | 'DUPLICATE'
  | 'REJECTED';

export type PhotoMatchMethod = 
  | 'EXACT_FILENAME'
  | 'FUZZY_FILENAME'
  | 'SEQUENTIAL'
  | 'MANUAL';

export interface PhotoItem {
  id: string;
  projectId: string;
  recordId: string | null;
  originalFilename: string;
  dataUrl: string; // base64 data url or local blob url
  matchConfidence: number | null; // 0 to 1
  matchMethod: PhotoMatchMethod | null;
  status: PhotoStatus;
  createdAt: string;
}

export type BarcodeSymbology = 'qrcode' | 'code128' | 'ean13' | 'code39' | 'upca';

export interface BarcodeOptions {
  symbology: BarcodeSymbology;
  includeText?: boolean;
  scale?: number;
}

export interface ReferenceImageConfig {
  id: string;
  url: string;
  opacity: number;       // 0..1
  visible: boolean;
  locked: boolean;
  scaleMode: 'fit' | 'fill' | 'manual';
  x: number;             // mm
  y: number;             // mm
  width: number;         // mm
  height: number;        // mm
}

export interface RenderElement {
  id: string;
  name?: string;       // Custom layer name
  type: 'text' | 'image' | 'photo_placeholder' | 'shape' | 'barcode';
  shapeType?: 'rect' | 'circle';
  barcode?: BarcodeOptions;
  x: number;          // position in mm
  y: number;          // position in mm
  width: number;      // width in mm
  height: number;     // height in mm
  rotation: number;   // degrees
  opacity: number;    // 0..1
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  binding?: string | null; // variable key, e.g., "name" or "roll_no"
  text?: string;       // static text template e.g., "STUDENT ID CARD"
  style?: {
    fontSize?: number;  // in pt
    fontFamily?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
  };
  imageKey?: string;   // dataUrl or image key for static artwork
  visible?: boolean;
  locked?: boolean;
  isArtwork?: boolean;
}

export interface TemplateItem {
  id: string;
  projectId: string;
  name: string;
  cardWidthMm: number;
  cardHeightMm: number;
  dpi: number;
  backgroundColor?: string;
  sceneGraph: RenderElement[];
  sceneGraphBack?: RenderElement[];
  referenceImageFront?: ReferenceImageConfig;
  referenceImageBack?: ReferenceImageConfig;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CropMarkStyle = 'NONE' | 'CORNER' | 'FULL';
export type PositionOrder = 'ROW_MAJOR' | 'COLUMN_MAJOR';
export type ImpositionMode = 'SEQUENTIAL_FILL' | 'CUT_STACK_TRANSPOSE';

export interface PrintProfileItem {
  id: string;
  name: string;
  sheetWidthMm: number;
  sheetHeightMm: number;
  cardTrimWidthMm: number;
  cardTrimHeightMm: number;
  bleedMm: number;
  safeZoneMm: number;
  rows: number;
  cols: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gutterXMm: number;
  gutterYMm: number;
  cropMarkStyle: CropMarkStyle;
  positionOrder: PositionOrder;
  impositionMode: ImpositionMode;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  projectType: ProjectType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationProgress {
  total: number;
  current: number;
  status: 'idle' | 'generating' | 'done' | 'failed';
  speedCardsPerSec: number;
  errors: Array<{ recordId: string; message: string }>;
}
