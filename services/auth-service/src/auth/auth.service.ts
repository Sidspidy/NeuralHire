import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async register(registerDto: RegisterDto) {
        // Prevent self-registration as ADMIN
        if (registerDto.role === Role.ADMIN) {
            throw new UnauthorizedException('Cannot register as ADMIN. Please contact system administrator.');
        }

        // Only allow RECRUITER and CANDIDATE
        if (![Role.RECRUITER, Role.CANDIDATE].includes(registerDto.role)) {
            throw new UnauthorizedException('Invalid role. Allowed roles: RECRUITER, CANDIDATE');
        }

        const user = await this.usersService.create(
            registerDto.email,
            registerDto.name,
            registerDto.password,
            registerDto.role,
        );

        const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.name, user.role);

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.name || '', user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            accessToken,
            refreshToken,
        };
    }

    async refreshToken(token: string) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (storedToken.expiresAt < new Date()) {
            // Token is expired - delete it and throw error
            try {
                await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            } catch (error) {
                // Ignore if already deleted
            }
            throw new UnauthorizedException('Refresh token expired');
        }

        // Delete old token BEFORE generating new ones to avoid unique constraint violation
        try {
            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        } catch (error) {
            // If deleting fails because it doesn't exist (concurrency), it's fine, 
            // but we should probably treat it as invalid invalidation if strict.
            // For now, if we can't find it to delete, it means it's already used/deleted.
            if (error.code === 'P2025') {
                // Record to delete does not exist.
                // This happens in race conditions where another request already refreshed it.
                // We should stop here and throw Unauthorized because the token is no longer valid (deleted).
                throw new UnauthorizedException('Invalid refresh token');
            }
            throw error;
        }

        const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
            storedToken.user.id,
            storedToken.user.email,
            storedToken.user.name || '',
            storedToken.user.role,
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    private async generateTokens(userId: string, email: string, name: string, role: Role) {
        const payload = {
            sub: userId,
            email,
            name,
            role,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: '15m',
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
        });

        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return { accessToken, refreshToken };
    }
}
