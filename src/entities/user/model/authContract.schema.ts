import { z } from "zod";
import { AUTH_SYSTEM_ROLES, AUTH_USER_STATUSES } from "./authContract.types";
import type {
  AuthApiResponse,
  AuthSessionDto,
  AuthUserDto,
  CurrentSessionDto,
} from "./authContract.types";

/** Validates public C# user data and removes unexpected fields, including secrets. */
export const authUserDtoSchema: z.ZodType<AuthUserDto> = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  role: z.enum([AUTH_SYSTEM_ROLES.OWNER, AUTH_SYSTEM_ROLES.VERIFIER, AUTH_SYSTEM_ROLES.ADMIN]),
  status: z.enum([
    AUTH_USER_STATUSES.PENDING,
    AUTH_USER_STATUSES.ACTIVE,
    AUTH_USER_STATUSES.INACTIVE,
  ]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
});

/** Cookie session payload; access/refresh tokens are not JSON credentials. */
export const authSessionDtoSchema: z.ZodType<AuthSessionDto> = z.object({
  userId: z.string().uuid(),
  expiresIn: z.number().int().nonnegative(),
  user: authUserDtoSchema,
});

/** Public payload returned by GET /auth/session. */
export const currentSessionDtoSchema: z.ZodType<CurrentSessionDto> = z.object({
  user: authUserDtoSchema,
});

/** Login/refresh envelope returned by the current C# controller. */
export const authSessionResponseSchema: z.ZodType<AuthApiResponse<AuthSessionDto>> = z.object({
  data: authSessionDtoSchema,
});

/** Bootstrap envelope returned by the current C# controller. */
export const currentSessionResponseSchema: z.ZodType<AuthApiResponse<CurrentSessionDto>> = z.object(
  {
    data: currentSessionDtoSchema,
  },
);
