// src/modules/voter-data/voter-data.service.ts
//import { CACHE_MANAGER } from '@nestjs/cache-manager';
//import type { Cache } from 'cache-manager';
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VoterData } from '../voter-data/schemas/voter-data.schema'; //'./schemas/voter-data.schema';
import { UploadExcelResponseDto } from './dto/upload-excel.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VoterDataService {
  private readonly apiUrl: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly STATIC_DATA_MODE: boolean;

  constructor(
    @InjectModel(VoterData.name) private voterDataModel: Model<VoterData>,
    //@Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get('THIRD_PARTY_API_URL');
    this.apiKey = this.configService.get('THIRD_PARTY_API_KEY');
    this.STATIC_DATA_MODE = this.configService.get('STATIC_DATA') === '1';
  }

  async searchMultiple(epicNumbers: string[]) {
    console.log('now in service class at search method', epicNumbers);
    const results = await Promise.all(
      epicNumbers.map((epicNo) => this.searchSingle(epicNo.trim())),
    );

    return results.filter((r) => r !== null);
  }

  async searchSingle(epicNo: string) {
    // Step 1: Check cache
    const cacheKey = `voter:${epicNo}`;
    /*try {
      const cachedData = await this.cacheManager.get(cacheKey);

      if (cachedData) {
        console.log(`Cache hit for ${epicNo}`);
        return { ...cachedData, dataSource: 'cache' };
      }
    } catch (error) {
      console.log(error);
    }*/

    // Step 2: Check database
    let voterData = await this.voterDataModel.findOne({
      epic_no: epicNo,
      isDisabled: false,
    });

    if (voterData) {
      console.log(`Database hit for ${epicNo}`);
      // Store in cache for next time
      /*try {
        await this.cacheManager.set(cacheKey, voterData.toObject(), 3600);
      } catch (error: any) {
        console.log('error', error);
      }*/

      return { ...voterData.toObject(), dataSource: 'database' };
    }

    // Step 3: Call third-party API

    let finalData = null;
    //STATIC MODE → Read from JSON file

    if (this.STATIC_DATA_MODE) {
      const filePath = path.join(
        process.cwd(),
        'src',
        'static-data',
        'tempData.json',
      );
      console.log('filePath ::', filePath);

      try {
        const fileContent = await fs.readFileSync(filePath, 'utf8');
        //console.log('fileContent ::',fileContent);
        const jsonData = JSON.parse(fileContent);
        console.log('jsonData ::', jsonData);
        if (!jsonData?.data) {
          throw new Error('Invalid static JSON format.');
        }

        // Replace EPIC number dynamically
        if (jsonData.data.epic_no === epicNo) {
          let response = { data: jsonData };
          console.log('static response data josn ::', response);

          if (response?.data?.success && response?.data?.data) {
            console.log('static json process with if condition');
            const apiData = response?.data?.data;

            console.log('going to save data in db');
            // Save to database
            let voterData = await this.voterDataModel.create({
              ...apiData,
              dataSource:
                this.configService.get('STATIC_DATA') === '1'
                  ? 'static'
                  : 'api', // optional tweak
            });
            console.log('save data in db done');

            console.log('going to save data in cache');
            /*try {
              await this.cacheManager.set(cacheKey, voterData.toObject(), 3600);
            } catch (error) {}*/
            // Save to cache

            console.log('save data in cache done');

            console.log('going to return data to controller');
            return {
              ...voterData.toObject(),
              dataSource:
                this.configService.get('STATIC_DATA') === '1'
                  ? 'static'
                  : 'api', // optional
            };
          } else {
            return null;
          }
        } else {
          return null;
        }
      } catch (err: any) {
        throw new HttpException(
          `Unable to read static tempData.json → ${err?.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      const response = await axios.get(`${this.apiUrl}/${epicNo}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response?.data?.success && response?.data?.data) {
        const apiData = response?.data?.data;

        // Save to database
        voterData = await this.voterDataModel.create({
          ...apiData,
          dataSource: 'api',
        });

        /*try {
          // Save to cache
          await this.cacheManager.set(cacheKey, voterData.toObject(), 3600);
        } catch (error) {}*/

        return { ...voterData.toObject(), dataSource: 'api' };
      } else {
        return null;
      }
    }
  }

  async findAll(query: any, options: any) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      filter = {},
    } = options;

    const skip = (page - 1) * limit;

    const searchQuery: any = { isDisabled: false, ...filter };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { epic_no: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.voterDataModel
        .find(searchQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.voterDataModel.countDocuments(searchQuery),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async disable(epicNo: string, userId: string) {
    return this.voterDataModel.findOneAndUpdate(
      { epic_no: epicNo },
      {
        isDisabled: true,
        disabledBy: userId,
        disabledAt: new Date(),
      },
      { new: true },
    );
  }

  async enable(epicNo: string, userId: string) {
    return this.voterDataModel.findOneAndUpdate(
      { epic_no: epicNo },
      {
        isDisabled: false,
        disabledBy: userId,
        disabledAt: new Date(),
      },
      { new: true },
    );
  }

  async delete(epicNo: string) {
    // Clear cache
    //await this.cacheManager.del(`voter:${epicNo}`);

    // Delete from database
    return this.voterDataModel.findOneAndDelete({ epic_no: epicNo });
  }

  async findById(id: string) {
    try {
      const voterData = await this.voterDataModel.findById(id);
      if (!voterData) {
        throw new HttpException('Voter data not found', HttpStatus.NOT_FOUND);
      }
      if (voterData.isDisabled) {
        throw new HttpException('Voter data is disabled', HttpStatus.FORBIDDEN);
      }
      return voterData.toObject();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  /***
   * Handle file upload with validation and configuration
   * This method centralizes file upload configuration and validation
   */
  async handleFileUpload(file: Express.Multer.File): Promise<UploadExcelResponseDto> {
    // Validate file upload configuration
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Validate file type
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new HttpException('Please upload an Excel file (.xlsx or .xls)', HttpStatus.BAD_REQUEST);
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new HttpException('File size exceeds 10MB limit', HttpStatus.PAYLOAD_TOO_LARGE);
    }

    // Process the Excel file
    return this.importFromExcel(file);
  }

  /***
   * Import data from Excel file uploaded via multipart form data
   * Excel headers: SL No, EPIC, Part/Serial, Name, Relative Name, House, Extra1, Extra2, Gender
   * Schema mapping: 
   * SL No -> not stored (auto increment)
   * EPIC -> epic_no
   * Part/Serial -> serial_number  
   * Name -> name
   * Relative Name -> relation_name
   * House -> address_line
   * Gender -> gender
   */
  async importFromExcel(file: Express.Multer.File) {
    try {
      // Import xlsx library
      const XLSX = require('xlsx');
      
      // Parse Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON array
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!data || data.length === 0) {
        throw new HttpException('Excel file is empty', HttpStatus.BAD_REQUEST);
      }

      // Extract headers (first row)
      const headers = data[0].map((header: string) => header?.toString().trim());
      
      // Define expected headers mapping
      const headerMapping: { [key: string]: string } = {
        'SL No': 'slNo',
        'EPIC': 'epic_no',
        'Part/Serial': 'serial_number',
        'Name': 'name',
        'Relative Name': 'relation_name',
        'House': 'address_line',
        'Gender': 'gender'
      };

      // Validate required headers
      const requiredHeaders = ['EPIC', 'Name'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        throw new HttpException(
          `Missing required headers: ${missingHeaders.join(', ')}. Required headers are: ${requiredHeaders.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Process data rows (skip header row)
      const rows = data.slice(1).filter((row: any[]) => row.length > 0 && row.some(cell => cell));
      
      if (rows.length === 0) {
        throw new HttpException('No data rows found in Excel file', HttpStatus.BAD_REQUEST);
      }

      const importResults = {
        totalRows: rows.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
        duplicates: [] as string[]
      };

      const bulkOperations: any[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const rowIndex = i + 2; // +2 because we skip header and array is 0-indexed
          
          // Create object with mapped data
          const voterRecord: any = {
            epic_no: '',
            name: '',
            status: 'active',
            gender: '',
            serial_number: '',
            relation_name: '',
            address_line: '',
            dataSource: 'excel_import',
          };

          // Map each column to the appropriate field
          headers.forEach((header: string, colIndex: number) => {
            const mappedField = headerMapping[header];
            if (mappedField && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
              const value = row[colIndex].toString().trim();
              
              switch (mappedField) {
                case 'epic_no':
                  voterRecord.epic_no = value;
                  break;
                case 'name':
                  voterRecord.name = value;
                  break;
                case 'serial_number':
                  voterRecord.serial_number = value;
                  break;
                case 'relation_name':
                  voterRecord.relation_name = value;
                  break;
                case 'address_line':
                  voterRecord.address_line = value;
                  break;
                case 'gender':
                  voterRecord.gender = value;
                  break;
              }
            }
          });

          // Validate required fields
          if (!voterRecord.epic_no || !voterRecord.name) {
            importResults.errors.push(`Row ${rowIndex}: Missing required fields - EPIC and Name are mandatory`);
            importResults.failed++;
            continue;
          }

          // Check for duplicates
          const existingVoter = await this.voterDataModel.findOne({ epic_no: voterRecord.epic_no });
          if (existingVoter) {
            importResults.duplicates.push(`EPIC ${voterRecord.epic_no} (already exists)`);
            importResults.failed++;
            continue;
          }

          // Add to bulk operations
          bulkOperations.push({
            insertOne: {
              document: voterRecord
            }
          });

          importResults.successful++;

        } catch (rowError: any) {
          importResults.errors.push(`Row ${i + 2}: ${rowError.message}`);
          importResults.failed++;
        }
      }

      // Execute bulk operations if any
      if (bulkOperations.length > 0) {
        const bulkResult = await this.voterDataModel.bulkWrite(bulkOperations);
        console.log(`Bulk insert completed: ${bulkResult.insertedCount} documents inserted`);
      }

      console.log(`Import completed. Total: ${importResults.totalRows}, Success: ${importResults.successful}, Failed: ${importResults.failed}`);

      return {
        success: true,
        message: 'Excel file processed successfully',
        summary: {
          totalRows: importResults.totalRows,
          successful: importResults.successful,
          failed: importResults.failed,
          duplicatesCount: importResults.duplicates.length
        },
        details: {
          duplicates: importResults.duplicates,
          errors: importResults.errors
        }
      };

    } catch (error: any) {
      console.error('Error processing Excel file:', error);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        throw new HttpException('File too large', HttpStatus.PAYLOAD_TOO_LARGE);
      }
      
      throw new HttpException(
        `Error processing Excel file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
