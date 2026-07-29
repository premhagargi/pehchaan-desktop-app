# 🎴 Pehchaan Desktop App

> **Pehchaan** (पहचान) — A modern, high-performance desktop application for designing, managing, and batch printing ID cards, certificates, visitor badges, and employee credentials.

[![Build Desktop App](https://github.com/premhagargi/pehchaan-desktop-app/actions/workflows/build.yml/badge.svg)](https://github.com/premhagargi/pehchaan-desktop-app/actions/workflows/build.yml)
[![Electron](https://img.shields.io/badge/Electron-34.x-4B8BBE?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🎨 Visual Template Designer
- **Precision Millimeter Grid**: Design cards with exact dimensions (CR80 85.6mm × 53.98mm, A6 Certificate 148mm × 105mm, Custom Badges).
- **Power Right-Click Context Menu**: Instant access to Field Binding, Typography, Color Swatches, Layer Ordering (Bring to Front, Send to Back), Object Alignments, and Numeric Transform (X, Y, W, H, Rotation).
- **Rich Elements**: Text boxes, shapes (Rectangles, Circles, Polygons), Photo Placeholders with aspect ratio locking, and Barcode/QR Code symbologies.
- **Hugeicons Integration**: Crisp, modern icon system powered by Hugeicons.

### 🔗 Dynamic Data & Field Binding
- **Variable Field Insertion**: Bind text boxes, photos, and barcodes directly to record fields (`Name`, `Roll No`, `Photo`, `Department`, `Blood Group`, etc.).
- **Static & Template Text**: Combine fixed text with dynamic tags (e.g. `ID: {{roll_no}}`).
- **Live Canvas Preview**: Real-time record switching to preview exact dynamic card output.

### 📊 Bulk Record & Asset Management
- **Spreadsheet Data Grid**: Inline editing, row selection, search filtering, and bulk record deletion/cloning.
- **Excel & CSV Import**: Effortlessly import student or employee data from standard `.xlsx` / `.csv` files.
- **Photo Folder Binding**: Automatic batch linking of photos by matching record IDs or filenames.

### 🖨️ High-Resolution Batch Printing & PDF Export
- **Print Layout Engine**: Multi-card page arrangement (Grid layouts, custom margins, crop marks for guillotine cutting).
- **High-DPI Output**: Ultra-sharp vector text and barcode rendering for card printers (Evolis, Zebra, Fargo, Datacard).
- **Single & Double-Sided Printing**: Support for front and back ID card templates.

---

## 🛠️ Tech Stack

- **Desktop Framework**: [Electron](https://www.electronjs.org/)
- **Frontend Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Canvas Engine**: [Konva](https://konvajs.org/) / [React-Konva](https://github.com/konvajs/react-konva)
- **Styling & Aesthetics**: [Tailwind CSS](https://tailwindcss.com/), [Hugeicons](https://hugeicons.com/)
- **Packaging**: [Electron Builder](https://www.electron.build/)
- **CI/CD Pipeline**: GitHub Actions

---

## 🚀 Quick Start (Development)

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/premhagargi/pehchaan-desktop-app.git
   cd pehchaan-desktop-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```

---

## 📦 Building Executables

### Local Build (Windows .exe)
To package the app into a standalone Windows installer and portable executable:

```bash
npm run dist
```

The output installer (`.exe`) will be generated inside the `dist_electron/` directory.

---

## 🤖 Continuous Integration & Releases

Automated Windows executable builds are powered by **GitHub Actions** on every push to `main`.

- **Artifact Downloads**: Download ready-to-run `.exe` installers directly from the **Actions** tab of the repository.
- **Automated Releases**: Push a git tag (e.g. `v1.0.0`) to trigger an automatic GitHub Release containing installer binaries:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Crafted with ❤️ by Prem Hagargi</p>
