import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UNIT_TYPES, type UnitType } from '../access/access.service.js';

// Mã trong HRIS (Person_Serial_Key, DP..., DS...): chỉ chữ và số.
const KEY = /^[A-Za-z0-9]{1,20}$/;

export class ScopeUnitDto {
  @IsIn(UNIT_TYPES)
  type!: UnitType;

  @Matches(KEY)
  key!: string;
}

/** Trạng thái mong muốn của một người sau khi lưu. */
export class ManagerChangeDto {
  @Matches(KEY)
  personSerialKey!: string;

  @IsString()
  @MaxLength(20)
  personId!: string;

  /** Họ tên lúc đổi — chỉ để ghi lịch sử. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  personName?: string;

  /** true = là chủ quản (được vào hệ thống), false = thu hồi quyền. */
  @IsBoolean()
  active!: boolean;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ScopeUnitDto)
  scopes!: ScopeUnitDto[];
}

export class SaveManagersDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ManagerChangeDto)
  changes!: ManagerChangeDto[];
}
