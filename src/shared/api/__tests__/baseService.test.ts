import { describe, it, expect, vi } from "vitest";
import { createBaseService } from "../baseService";
import type { PaginatedList, SelectOption } from "@/shared/types";

interface MockProduct {
  id: number;
  name: string;
  price: number;
}

interface CreateProductDto {
  name: string;
  price: number;
}

describe("createBaseService", () => {
  it("should create a service with all standard CRUD operations", () => {
    const service = createBaseService<MockProduct, CreateProductDto>({
      endpoint: "/products",
    });

    expect(service.getAll).toBeDefined();
    expect(service.getById).toBeDefined();
    expect(service.create).toBeDefined();
    expect(service.update).toBeDefined();
    expect(service.remove).toBeDefined();
    expect(service.getSelectOptions).toBeDefined();
  });

  it("should call custom implementation when provided in config", async () => {
    const customOptions: SelectOption[] = [
      { label: "Sản phẩm A", value: 1 },
      { label: "Sản phẩm B", value: 2 },
    ];

    const service = createBaseService<MockProduct>({
      endpoint: "/products",
      getSelectOptions: vi.fn().mockResolvedValue(customOptions),
    });

    const result = await service.getSelectOptions();
    expect(result).toEqual(customOptions);
  });

  it("should support custom getAll implementation", async () => {
    const mockData: PaginatedList<MockProduct> = {
      items: [{ id: 1, name: "Laptop", price: 1000 }],
      totalCount: 1,
      pageIndex: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    const service = createBaseService<MockProduct>({
      endpoint: "/products",
      getAll: vi.fn().mockResolvedValue(mockData),
    });

    const res = await service.getAll();
    expect(res.items).toHaveLength(1);
    expect(res.items[0].name).toBe("Laptop");
  });
});
