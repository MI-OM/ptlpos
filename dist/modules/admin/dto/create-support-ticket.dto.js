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
exports.CreateSupportTicketDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "LOW";
    TicketPriority["MEDIUM"] = "MEDIUM";
    TicketPriority["HIGH"] = "HIGH";
    TicketPriority["URGENT"] = "URGENT";
})(TicketPriority || (TicketPriority = {}));
var TicketCategory;
(function (TicketCategory) {
    TicketCategory["BILLING"] = "BILLING";
    TicketCategory["TECHNICAL"] = "TECHNICAL";
    TicketCategory["FEATURE_REQUEST"] = "FEATURE_REQUEST";
    TicketCategory["BUG_REPORT"] = "BUG_REPORT";
    TicketCategory["ACCOUNT_ISSUE"] = "ACCOUNT_ISSUE";
    TicketCategory["OTHER"] = "OTHER";
})(TicketCategory || (TicketCategory = {}));
class CreateSupportTicketDto {
    tenantId;
    userId;
    subject;
    description;
    priority;
    category;
}
exports.CreateSupportTicketDto = CreateSupportTicketDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tenant ID',
        example: 'cmo9m3pup0000k67o4ge49x62',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID who created the ticket',
        example: 'cmo9m3qxy1000k67o4ge49x63',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ticket subject',
        example: 'Issue with inventory synchronization',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detailed description of the issue',
        example: 'The inventory is not syncing across multiple branches. When we update stock in one branch, it does not reflect in others.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ticket priority',
        enum: TicketPriority,
        example: TicketPriority.HIGH,
    }),
    (0, class_validator_1.IsEnum)(TicketPriority),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ticket category',
        enum: TicketCategory,
        example: TicketCategory.TECHNICAL,
    }),
    (0, class_validator_1.IsEnum)(TicketCategory),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "category", void 0);
//# sourceMappingURL=create-support-ticket.dto.js.map