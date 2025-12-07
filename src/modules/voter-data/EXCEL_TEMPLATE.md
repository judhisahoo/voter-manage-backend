# Excel File Upload Template

## Expected Excel File Format

Your Excel file should have the following column headers in the **exact order**:

| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I |
|----------|----------|----------|----------|----------|----------|----------|----------|----------|
| SL No    | EPIC     | Part/Serial | Name | Relative Name | House | Extra1 | Extra2 | Gender |

## Column Mapping

- **SL No**: Auto-increment number (not stored in database)
- **EPIC**: Maps to `epic_no` field (required)
- **Part/Serial**: Maps to `serial_number` field  
- **Name**: Maps to `name` field (required)
- **Relative Name**: Maps to `relation_name` field
- **House**: Maps to `address_line` field
- **Gender**: Maps to `gender` field
- **Extra1 & Extra2**: Currently not mapped (optional)

## Validation Rules

1. **Required Fields**: EPIC and Name must be provided
2. **Duplicate Check**: EPIC numbers must be unique (no duplicates allowed)
3. **File Format**: Only `.xlsx` and `.xls` files are accepted
4. **File Size**: Maximum 10MB

## Sample Data

| SL No | EPIC | Part/Serial | Name | Relative Name | House | Extra1 | Extra2 | Gender |
|-------|------|-------------|------|---------------|-------|--------|--------|--------|
| 1 | ABC123456 | PS001 | John Doe | Jane Doe | 123 Main St | - | - | Male |
| 2 | DEF789012 | PS002 | Mary Smith | Bob Smith | 456 Oak Ave | - | - | Female |

## API Usage

### Endpoint
```
POST /voter-data/upload-excel
```

### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

### Form Data
- **file**: Your Excel file

### Response Example
```json
{
  "success": true,
  "message": "Excel file processed successfully",
  "summary": {
    "totalRows": 100,
    "successful": 95,
    "failed": 5,
    "duplicatesCount": 3
  },
  "details": {
    "duplicates": [
      "EPIC123456 (already exists)",
      "EPIC789012 (already exists)"
    ],
    "errors": [
      "Row 5: Missing required fields - EPIC and Name are mandatory",
      "Row 10: Invalid gender value"
    ]
  }
}