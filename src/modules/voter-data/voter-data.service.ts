// src/modules/voter-data/voter-data.service.ts
//import { CACHE_MANAGER } from '@nestjs/cache-manager';
//import type { Cache } from 'cache-manager';
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VoterData } from '../voter-data/schemas/voter-data.schema'; //'./schemas/voter-data.schema';
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

  async delete(epicNo: string) {
    // Clear cache
    await this.cacheManager.del(`voter:${epicNo}`);

    // Delete from database
    return this.voterDataModel.findOneAndDelete({ epic_no: epicNo });
  }
}
