import { JwtService } from '@nestjs/jwt'
import { SecurityUtils } from '../../utils/security.utils'
import { BaseUser } from '../base-user.model'
import { BaseUserService } from '../base-user.service'

export interface SocialAuthUser {
  email: string
  firstName: string
  lastName: string
  picture: string
}

export class BaseAuthService {
  constructor(
    protected baseUserService: BaseUserService,
    protected jwtService: JwtService,
  ) {}

  async getUserFromSSO(user: SocialAuthUser): Promise<{ user: BaseUser; isNew: boolean }> {
    const existingUser = await this.baseUserService.findOne({ email: user.email })
    if (existingUser) {
      return { user: existingUser, isNew: false }
    }
    const newUser = await this.baseUserService.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      emailVerified: true,
      // TODO save picture
      avatar: user.picture,
    })
    return { user: newUser, isNew: true }
  }

  generateAccessToken(user: BaseUser): { accessToken: string } {
    const accessToken = this.jwtService.sign(
      {
        id: user._id,
        email: user.email,
      },
      { secret: process.env.JWT_SECRET },
    )
    return {
      accessToken,
    }
  }

  async generateAndSaveRefreshToken(user: BaseUser): Promise<string> {
    const plainRefreshToken = SecurityUtils.generateRandomString(48)
    const refreshTokenHash = await SecurityUtils.hashWithBcrypt(plainRefreshToken, 12)
    await this.baseUserService.updateOne({ _id: user._id }, { refreshTokenHash })
    return plainRefreshToken
  }

  async passwordIsValid(user: BaseUser, password: string): Promise<boolean> {
    return (
      !!password && !!user?.hashedPassword && (await SecurityUtils.bcryptHashIsValid(password, user.hashedPassword))
    )
  }

  async refreshTokenIsValid(user: BaseUser, refreshToken: string): Promise<boolean> {
    return (
      !!refreshToken &&
      !!user?.refreshTokenHash &&
      (await SecurityUtils.bcryptHashIsValid(refreshToken, user.refreshTokenHash))
    )
  }
}
