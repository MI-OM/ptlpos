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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const common_2 = require("@nestjs/common");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const create_product_dto_1 = require("./dto/create-product.dto");
const composite_product_dto_1 = require("./dto/composite-product.dto");
const query_products_dto_1 = require("./dto/query-products.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const upload_product_image_response_dto_1 = require("./dto/upload-product-image-response.dto");
const products_service_1 = require("./products.service");
let ProductsController = class ProductsController {
    productsService;
    constructor(productsService) {
        this.productsService = productsService;
    }
    findAll(user, query) {
        return this.productsService.findAll(user.tenantId, query);
    }
    create(user, dto) {
        return this.productsService.create(user, dto);
    }
    update(user, id, dto) {
        return this.productsService.update(user, id, dto);
    }
    createComposite(user, dto) {
        return this.productsService.createComposite(user, dto);
    }
    getComposite(user, id) {
        return this.productsService.getComposite(user.tenantId, id);
    }
    getCompositeWithInventory(user, id) {
        return this.productsService.getCompositeWithInventory(user.tenantId, id);
    }
    getProductHistory(user, id, page, limit, type) {
        return this.productsService.getProductHistory(user.tenantId, id, Number(page ?? 1), Number(limit ?? 20), type);
    }
    async uploadProductImage(user, id, file, metadata) {
        return this.productsService.uploadProductImage(user, id, file, metadata);
    }
    async uploadMultipleProductImages(user, id, files, metadata) {
        return this.productsService.uploadMultipleProductImages(user, id, files, metadata);
    }
    deleteProductImage(user, id, imageId) {
        return this.productsService.deleteProductImage(user, id, imageId);
    }
    remove(user, id) {
        return this.productsService.remove(user, id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all products' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 15 }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, example: 'laptop' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String, example: 'category-123' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['SIMPLE', 'VARIANT', 'COMPOSITE'], example: 'SIMPLE' }),
    (0, swagger_1.ApiQuery)({ name: 'includeVariants', required: false, type: Boolean, example: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInventory', required: false, type: Boolean, example: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Products list' }),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_products_dto_1.QueryProductsDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a simple or variant product' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Product created' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a product' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product updated' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a composite product (bundle)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Composite product created',
        example: {
            id: 'prod-123',
            name: 'Bread Bundle',
            sku: 'BREAD-BUNDLE',
            type: 'COMPOSITE',
            price: 99.99,
            compositeParent: [
                {
                    childProductId: 'bread-white',
                    quantity: 2,
                    child: { id: 'bread-white', name: 'White Loaf', sku: 'BREAD-W' },
                },
                {
                    childProductId: 'bread-brown',
                    quantity: 1,
                    child: { id: 'bread-brown', name: 'Brown Loaf', sku: 'BREAD-B' },
                },
            ],
        },
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('composite'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, composite_product_dto_1.CompositeProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "createComposite", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get composite product details with components' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Composite product ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Composite product details',
    }),
    (0, common_1.Get)('composite/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getComposite", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get composite product with component inventory levels' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Composite product ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Composite product with inventory',
        example: {
            id: 'prod-123',
            name: 'Bread Bundle',
            allComponentsAvailable: true,
            compositeParent: [
                {
                    component: { id: 'bread-white', name: 'White Loaf' },
                    quantity: 2,
                    availableStock: 10,
                    canFulfill: true,
                },
            ],
        },
    }),
    (0, common_1.Get)('composite/:id/inventory'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getCompositeWithInventory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive product history (sales, stock updates, purchases, transfers)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['SALE', 'PURCHASE', 'TRANSFER', 'ADJUSTMENT', 'OPENING', 'STOCKTAKE'], description: 'Filter by transaction type' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product history retrieved successfully',
    }),
    (0, common_1.Get)(':id/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getProductHistory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload product image' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product image uploaded successfully',
        type: upload_product_image_response_dto_1.UploadProductImageResponseDto,
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/upload-image'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_2.UploadedFile)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "uploadProductImage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload multiple product images' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Images uploaded successfully', type: upload_product_image_response_dto_1.UploadProductImageResponseDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files')),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/upload-images'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_2.UploadedFiles)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "uploadMultipleProductImages", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete product image' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiParam)({ name: 'imageId', description: 'Image ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product image deleted successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Delete)(':id/images/:imageId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('imageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "deleteProductImage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a product' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product deleted' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map