# Spare Parts Manager

A cross-platform desktop application for managing spare parts inventory in industrial and maintenance environments. Built with Electron, React, and SQLite.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## Features

- **Inventory Management**: Full CRUD operations for spare parts with automatic stock status calculation
- **Smart Search**: Real-time search with term highlighting across all part fields
- **Category Filtering**: Filter parts by category type (Seals, Electrical, Screws, Bolts, etc.)
- **Role-Based Access Control**: Three user roles - Admin, Editor, and User with different permissions
- **Excel Import/Export**: Import inventory from Excel files with column mapping wizard; export to Excel
- **Dashboard Analytics**: Visual charts showing inventory statistics, stock levels, and category distribution
- **Theme Support**: Dark, Light, and System theme options (persisted)
- **Column Customization**: Show/hide table columns with persistence
- **Auto-Updates**: Automatic application updates via GitHub releases
- **Comprehensive Logging**: Application logs for troubleshooting

## Screenshots

*Screenshots coming soon*

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/) (package manager & runtime)
- **Framework**: [Electron](https://www.electronjs.org/) 33+ with [electron-vite](https://electron-vite.org/)
- **Frontend**: [React](https://react.dev/) 19 + TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4 + custom shadcn/ui-style components
- **Database**: SQLite with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Charts**: [Recharts](https://recharts.org/)
- **Excel I/O**: [SheetJS](https://sheetjs.com/)
- **Logging**: [electron-log](https://github.com/megahertz/electron-log)
- **Packaging**: [electron-builder](https://www.electron.build/)
- **Auto-updates**: [electron-updater](https://www.electron.build/auto-update)

## Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/7kylor/electron-spare-parts-manager/releases) page:

- **macOS**: `.dmg` (Intel and Apple Silicon)
- **Windows**: `.exe` installer or portable
- **Linux**: `.AppImage` or `.deb`

### Build from Source

#### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later)
- [Node.js](https://nodejs.org/) (v18 or later, for native module rebuilding)

#### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/7kylor/electron-spare-parts-manager.git
   cd electron-spare-parts-manager
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Rebuild native modules for Electron:
   ```bash
   npx electron-rebuild -f -w better-sqlite3
   ```

4. Start development server:
   ```bash
   bun run dev
   ```

## Building for Production

### macOS
```bash
bun run build:mac
```
Output: `dist/spare-parts-manager-{version}-mac-{arch}.dmg`

### Windows
```bash
bun run build:win
```
Output: `dist/spare-parts-manager-{version}-setup.exe`

### Linux
```bash
bun run build:linux
```
Output: `dist/spare-parts-manager-{version}-linux-{arch}.AppImage`

### All Platforms
```bash
bun run build:all
```

## Usage

### Demo Credentials

The application comes with seeded demo users:

| Role   | Service Number | Password    |
|--------|---------------|-------------|
| Admin  | ADMIN001      | admin123    |
| Editor | EMP001        | editor123   |
| User   | EMP002        | user123     |

### User Roles

- **Admin**: Full access - can manage users, categories, and all inventory operations
- **Editor**: Can add, edit, and delete parts; cannot manage users
- **User**: Read-only access to inventory

### Importing Data

1. Navigate to the Import page
2. Select an Excel file (.xlsx, .xls)
3. Map your columns to the required fields (Name, Part Number, Quantity, etc.)
4. Preview and confirm the import

## Project Structure

```
src/
├── main/                 # Electron main process
│   ├── index.ts          # Main entry, window creation
│   ├── database/         # SQLite + Drizzle ORM
│   └── ipc/              # IPC handlers for all features
├── preload/              # Secure context bridge
├── renderer/             # React frontend
│   ├── pages/            # Application pages
│   ├── components/       # UI components
│   ├── stores/           # Zustand state stores
│   └── lib/              # Utilities
└── shared/
    └── types.ts          # Shared TypeScript types
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run db:studio` | Open Drizzle Studio for database inspection |

### Database

The application uses SQLite stored in the user's application data directory:
- **macOS**: `~/Library/Application Support/spare-parts-manager/`
- **Windows**: `%APPDATA%/spare-parts-manager/`
- **Linux**: `~/.config/spare-parts-manager/`

### Logs

Application logs are stored in:
- **macOS**: `~/Library/Application Support/spare-parts-manager/logs/`
- **Windows**: `%APPDATA%/spare-parts-manager/logs/`
- **Linux**: `~/.config/spare-parts-manager/logs/`

Access logs via Settings > Open Logs Folder.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Built by [Taher Al Kiyumi](https://github.com/7kylor)
