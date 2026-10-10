import { afterEach, describe, it, expect, vi } from "vitest";
import { AxiosHeaders } from "axios";
import { apiClient } from "../axiosClient";
import { HTTP_STATUS } from "@/shared/constants";
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

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

describe("createBaseService", () => {
  it.each(["getById", "create", "update"] as const)(
    "%s returns the body through the real response interceptor",
    async (operation) => {
      const product: MockProduct = { id: 1, name: "Laptop", price: 1000 };
      apiClient.defaults.adapter = async (config) => ({
        data: product,
        status: HTTP_STATUS.OK,
        statusText: "OK",
        headers: new AxiosHeaders(),
        config,
      });
      const service = createBaseService<MockProduct, CreateProductDto>({ endpoint: "/products" });
      const payload: CreateProductDto = { name: product.name, price: product.price };

      const result =
        operation === "getById"
          ? await service.getById(product.id)
          : operation === "create"
            ? await service.create(payload)
            : await service.update(product.id, payload);

      expect(result).toEqual(product);
    },
  );

  it("preserves the backend envelope instead of unwrapping it twice", async () => {
    const body = { data: { id: 1, name: "Laptop", price: 1000 } };
    apiClient.defaults.adapter = async (config) => ({
      data: body,
      status: HTTP_STATUS.OK,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    });

    const result = await apiClient.get<typeof body, typeof body>("/products/1");

    expect(result).toEqual(body);
  });

  it.each([undefined, ""])(
    "handles an empty 204 body (%s) without leaking AxiosResponse",
    async (body) => {
      apiClient.defaults.adapter = async (config) => ({
        data: body,
        status: HTTP_STATUS.NO_CONTENT,
        statusText: "No Content",
        headers: new AxiosHeaders(),
        config,
      });
      const service = createBaseService<MockProduct>({ endpoint: "/products" });

      expect(await apiClient.delete<typeof body, typeof body>("/products/1")).toBe(body);
      expect(await service.remove(1)).toBeUndefined();
    },
  );

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
