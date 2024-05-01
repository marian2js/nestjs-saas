#!/bin/bash

BASE_DIR="./src/user"

mkdir -p $BASE_DIR/auth

# User Model
cat << 'EOF' > $BASE_DIR/user.model.ts
import { SchemaFactory } from '@nestjs/mongoose'
import { BaseUser } from 'nestjs-saas'

export class User extends BaseUser {}
export const UserSchema = SchemaFactory.createForClass(User)
EOF

# User Service
cat << 'EOF' > $BASE_DIR/user.service.ts
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BaseUserService } from 'nestjs-saas'
import { User } from './user.model'

@Injectable()
export class UserService extends BaseUserService<User> {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    super(userModel)
  }
}
EOF

# User Controller
cat << 'EOF' > $BASE_DIR/users.controller.ts
import { Controller } from '@nestjs/common'
import { BaseUserController } from 'nestjs-saas'
import { User } from './user.model'
import { UserService } from './user.service'

@Controller('users')
export class UserController extends BaseUserController<User> {
  constructor(private userService: UserService) {
    super(userService)
  }
}
EOF

# Auth Service
cat << 'EOF' > $BASE_DIR/auth/auth.service.ts
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { BaseAuthService, EmailService } from 'nestjs-saas'
import { UserService } from '../user.service'

@Injectable()
export class AuthService extends BaseAuthService {
  constructor(
    protected userService: UserService,
    protected jwtService: JwtService,
    protected emailService: EmailService,
  ) {
    super(userService, jwtService, emailService)
  }
}
EOF

# Auth Controller
cat << 'EOF' > $BASE_DIR/auth/auth.controller.ts
import { Controller } from '@nestjs/common'
import { BaseAuthController } from 'nestjs-saas'
import { UserService } from '../user.service'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController extends BaseAuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {
    super(authService, userService)
  }
}
EOF

# Setup .env file at the project root
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
ENV_FILE=".env"
ENV_EXAMPLE="$SCRIPT_DIR/../.env.example"

# Check if .env exists, if not, create it
if [ ! -f $ENV_FILE ]; then
    touch $ENV_FILE
fi

# Append contents of env.example to .env
if [ -f $ENV_EXAMPLE ]; then
    cat $ENV_EXAMPLE >> $ENV_FILE
fi

echo "nestjs-saas project setup completed. Please update the .env file with your configurations."