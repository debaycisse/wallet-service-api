import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import {
  CreateApiKeySwagger,
  RolloverApiKeySwagger
} from '../common/decorators/swagger/api-keys.swagger';

@ApiTags('API Keys')
@Controller('keys')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @CreateApiKeySwagger()
  async createApiKey(
    @Req() req, @Body() createDto: CreateApiKeyDto
  ) {
    return this.apiKeysService.createApiKey(req.user.id, createDto);
  }

  @Post('rollover')
  @UseGuards(AuthGuard('jwt'))
  @RolloverApiKeySwagger()
  async rolloverApiKey(
    @Req() req, @Body() rolloverDto: RolloverApiKeyDto
  ) {
    return this.apiKeysService
      .rolloverApiKey(req.user.id, rolloverDto);
  }
}
