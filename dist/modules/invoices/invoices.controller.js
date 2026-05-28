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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const invoices_service_1 = require("./invoices.service");
const client_1 = require("@prisma/client");
let InvoicesController = class InvoicesController {
    invoicesService;
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    findAll(user, page, limit) {
        return this.invoicesService.findAll(user.tenantId, Number(page ?? 1), Number(limit ?? 20));
    }
    findOne(user, id) {
        return this.invoicesService.findOne(user.tenantId, id);
    }
    create(user, dto) {
        return this.invoicesService.create(user, dto);
    }
    async generateA4Invoice(user, id, res) {
        const html = await this.invoicesService.generateA4InvoiceHTML(user.tenantId, id);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.html"`);
        res.send(html);
    }
    async generateInvoicePDF(user, id, res) {
        const pdfBuffer = await this.invoicesService.generateInvoicePDF(user.tenantId, id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
        res.send(pdfBuffer);
    }
    async sendInvoice(user, id, body) {
        return this.invoicesService.sendInvoiceEmail(user, id, body?.email);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all invoices' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoices retrieved successfully' }),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create invoice from sale' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Invoice created successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Generate A4 invoice HTML' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'HTML invoice generated', content: { 'text/html': {} } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    (0, common_1.Get)(':id/a4'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "generateA4Invoice", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Generate invoice PDF' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF invoice generated', content: { 'application/pdf': {} } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "generateInvoicePDF", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Send invoice via email' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'No email address available' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/send'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "sendInvoice", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('invoices'),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map