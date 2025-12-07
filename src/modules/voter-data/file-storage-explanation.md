# File Upload and Storage Logic Analysis

## Current Implementation Status

**The current code does NOT store files in the "uploads" directory.**

### What Currently Happens:
1. File is received via multipart form data
2. File is processed in memory using `xlsx` library
3. Excel data is extracted and stored directly in MongoDB
4. Original file is discarded (not saved to disk)

### Current Controller Logic (lines 65-82):
```typescript
@Post('upload-excel')
@Roles(UserRole.ADMIN)
@ApiConsumes('multipart/form-data')
@UseInterceptors(FileInterceptor('file'))
async uploadExcel(@UploadedFile() file: Express.Multer.File): Promise<UploadExcelResponseDto> {
  return this.voterDataService.handleFileUpload(file);
}
```

### Current Service Logic (lines 257-276):
- Validates file type and size
- Calls `importFromExcel()` method
- Processes Excel data from `file.buffer` (in memory)

## What's Missing for File Storage

To store files in "uploads" directory, you need to:

1. **Configure Multer disk storage** instead of memory storage
2. **Add file storage configuration** to the FileInterceptor
3. **Modify the service method** to work with stored files

## Required Changes

### 1. Update Controller FileInterceptor:
```typescript
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      return cb(new Error('Only Excel files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}))
```

### 2. Update Service Method:
```typescript
async handleFileUpload(file: Express.Multer.File): Promise<UploadExcelResponseDto> {
  // file.path will now contain the path to saved file
  const filePath = file.path;
  
  // Read from saved file instead of file.buffer
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  
  // ... rest of processing logic
}
```

### 3. Add Required Imports:
```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';
```

## File Storage Benefits
- Files persist after server restart
- Can implement file cleanup policies
- Can serve files via static file serving
- Audit trail of uploaded files
- Backup and archival capabilities