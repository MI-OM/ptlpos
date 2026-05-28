"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
let TenantsService = class TenantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.tenant.findFirst({
            where: {
                name: dto.name,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('A tenant with this name already exists');
        }
        return this.prisma.tenant.create({
            data: {
                name: dto.name,
            },
        });
    }
    async me(context) {
        const tenant = await this.prisma.tenant.findUnique({
            where: {
                id: context.tenantId,
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async update(context, dto) {
        if (dto.name) {
            const existing = await this.prisma.tenant.findFirst({
                where: {
                    name: dto.name,
                    id: { not: context.tenantId },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('A tenant with this name already exists');
            }
        }
        return this.prisma.tenant.update({
            where: { id: context.tenantId },
            data: dto,
        });
    }
    async updateDetails(context, dto) {
        if (dto.email) {
            const existing = await this.prisma.tenant.findFirst({
                where: {
                    email: dto.email,
                    id: { not: context.tenantId },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('This email is already in use by another organization');
            }
        }
        return this.prisma.tenant.update({
            where: { id: context.tenantId },
            data: {
                email: dto.email,
                phone: dto.phone,
                website: dto.website,
                logoUrl: dto.logoUrl,
                industry: dto.industry,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                zipCode: dto.zipCode,
                country: dto.country,
            },
        });
    }
    async updateSettings(context, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: context.tenantId },
            select: { settings: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const currentSettings = tenant.settings || {};
        const updatedSettings = { ...currentSettings };
        if (dto.taxRate !== undefined) {
            updatedSettings.taxRate = dto.taxRate;
        }
        if (dto.taxEnabled !== undefined) {
            updatedSettings.taxEnabled = dto.taxEnabled;
        }
        if (dto.taxId !== undefined) {
            updatedSettings.taxId = dto.taxId;
        }
        if (dto.custom !== undefined) {
            Object.assign(updatedSettings, dto.custom);
        }
        return this.prisma.tenant.update({
            where: { id: context.tenantId },
            data: {
                settings: updatedSettings,
            },
        });
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map