import { IsEnum, IsMobilePhone, IsNumberString, IsString, MaxLength, MinLength } from 'class-validator';
import { FeePaymentMethod } from '@prisma/client';

export class SubmitPaymentProofDto {
  @IsMobilePhone(undefined, { strictMode: false })
  mobileNumber!: string;

  @IsEnum(FeePaymentMethod)
  method!: FeePaymentMethod;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  transactionId!: string;

  @IsNumberString({ no_symbols: false })
  amount!: string;
}
