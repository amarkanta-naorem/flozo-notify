import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DeviceTokenService } from '../services/device-token.service';
import {
  RegisterDeviceTokenDto,
  UpdateDeviceTokenDto,
  DeactivateDeviceTokenDto,
} from '../dto/device-token.dto';

export interface DeviceTokenResponse {
  success: boolean;
  id?: number;
  created?: boolean;
  message: string;
}

@Controller('device-tokens')
export class DeviceTokensController {
  private readonly logger = new Logger(DeviceTokensController.name);

  constructor(private readonly deviceTokenService: DeviceTokenService) {}

  @Post()
  async register(@Body() dto: RegisterDeviceTokenDto): Promise<DeviceTokenResponse> {
    try {
      const result = await this.deviceTokenService.registerDeviceToken(
        dto.userId,
        dto.token,
        dto.platform,
      );
      return {
        success: true,
        id: result.id,
        created: result.created,
        message: result.created
          ? 'Device token registered successfully'
          : 'Device token updated successfully',
      };
    } catch (error: any) {
      this.logger.error(`Failed to register device token: ${error.message}`);
      throw new HttpException(
        'Failed to register device token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put()
  async update(@Body() dto: UpdateDeviceTokenDto): Promise<DeviceTokenResponse> {
    try {
      const result = await this.deviceTokenService.registerDeviceToken(
        0, // userId not needed for update; service looks up by token
        dto.token,
        dto.platform,
      );
      return {
        success: true,
        id: result.id,
        created: result.created,
        message: 'Device token updated successfully',
      };
    } catch (error: any) {
      this.logger.error(`Failed to update device token: ${error.message}`);
      throw new HttpException(
        'Failed to update device token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  async deactivate(@Body() dto: DeactivateDeviceTokenDto): Promise<DeviceTokenResponse> {
    try {
      const deactivated = await this.deviceTokenService.deactivateDeviceToken(
        dto.token,
      );
      return {
        success: deactivated,
        message: deactivated
          ? 'Device token deactivated successfully'
          : 'Device token not found',
      };
    } catch (error: any) {
      this.logger.error(`Failed to deactivate device token: ${error.message}`);
      throw new HttpException(
        'Failed to deactivate device token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}