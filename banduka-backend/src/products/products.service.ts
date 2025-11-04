import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement product CRUD operations
  async findAll() {
    return this.prisma.product.findMany();
  }
}
