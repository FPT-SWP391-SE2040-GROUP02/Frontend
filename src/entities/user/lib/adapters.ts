import type { AuthUserDto } from "../model/authContract.types";
import type { User } from "../model/user.types";

/**
 * Maps the confirmed public C# user DTO to the existing UI model.
 * @param dto Validated account data from the official Backend service.
 * @returns UI user with unchanged role/status and nullable fields represented as optional values.
 */
export function toAuthUserViewModel(dto: AuthUserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.fullName,
    phone: dto.phone ?? undefined,
    role: dto.role,
    status: dto.status,
    createdAt: dto.createdAt,
    emailVerified: dto.emailVerified,
    hasPassword: dto.hasPassword,
  };
}
