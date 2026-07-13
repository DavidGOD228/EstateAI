import { User } from '../users/user.entity';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';

/** passwordHash is intentionally never included. */
export function toAuthUserResponse(user: User): AuthUserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
