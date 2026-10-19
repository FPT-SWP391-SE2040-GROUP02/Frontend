import type { PaginatedList, SelectOption } from "@/shared/types";
import { type AxiosInstance } from "axios";
import { apiClient } from "./axiosClient";

/**
 * @description Cấu hình khởi tạo cho Base CRUD Service.
 * Cho phép tùy biến endpoint, axios instance và ghi đè bất kỳ hàm CRUD nào khi có nghiệp vụ đặc thù.
 * @template TEntity Kiểu thực thể chính
 * @template TCreateDto Kiểu DTO truyền vào khi tạo mới
 * @template TUpdateDto Kiểu DTO truyền vào khi cập nhật
 * @template TFilterParams Kiểu tham số lọc khi lấy danh sách
 */
export interface BaseServiceConfig<TEntity, TCreateDto, TUpdateDto, TFilterParams> {
  /** Endpoint API tương ứng (ví dụ: "/products", "/users") */
  endpoint: string;
  /** Instance có interceptor trả HTTP body như apiClient; không truyền Axios instance chưa cấu hình. */
  axios?: AxiosInstance;
  /** Tùy chọn override phương thức lấy danh sách */
  getAll?: (params?: TFilterParams) => Promise<PaginatedList<TEntity>>;
  /** Tùy chọn override phương thức lấy chi tiết theo ID */
  getById?: (id: string | number) => Promise<TEntity>;
  /** Tùy chọn override phương thức tạo mới */
  create?: (data: TCreateDto) => Promise<TEntity>;
  /** Tùy chọn override phương thức cập nhật */
  update?: (id: string | number, data: TUpdateDto) => Promise<TEntity>;
  /** Tùy chọn override phương thức xóa */
  remove?: (id: string | number) => Promise<void>;
  /** Tùy chọn override phương thức lấy danh sách options cho dropdown */
  getSelectOptions?: () => Promise<SelectOption[]>;
}

/**
 * @description Giao diện chuẩn cho Base CRUD Service với đầy đủ các thao tác cơ bản.
 * @template TEntity Kiểu thực thể chính
 * @template TCreateDto Kiểu DTO truyền vào khi tạo mới
 * @template TUpdateDto Kiểu DTO truyền vào khi cập nhật
 * @template TFilterParams Kiểu tham số lọc khi lấy danh sách
 */
export interface BaseService<TEntity, TCreateDto, TUpdateDto, TFilterParams> {
  /** Lấy danh sách thực thể có phân trang và bộ lọc */
  getAll: (params?: TFilterParams) => Promise<PaginatedList<TEntity>>;
  /** Lấy thông tin chi tiết một thực thể theo ID */
  getById: (id: string | number) => Promise<TEntity>;
  /** Tạo mới một thực thể */
  create: (data: TCreateDto) => Promise<TEntity>;
  /** Cập nhật thông tin thực thể theo ID */
  update: (id: string | number, data: TUpdateDto) => Promise<TEntity>;
  /** Xóa một thực thể theo ID */
  remove: (id: string | number) => Promise<void>;
  /** Lấy danh sách SelectOption phục vụ Dropdown/Combobox */
  getSelectOptions: () => Promise<SelectOption[]>;
}

/**
 * @description Factory hàm tạo CRUD API Service tái sử dụng cho mọi Entity trong hệ thống SWP391.
 * Tuân thủ nguyên lý SOLID (DRY & Open/Closed): Tái sử dụng tối đa logic HTTP gọi API chuẩn C# ASP.NET Core,
 * đồng thời cho phép mở rộng / override phương thức bất kỳ khi có yêu cầu đặc thù.
 * Generic R mô tả HTTP body sau interceptor. Axios giữ conditional type với TEntity
 * chưa xác định, nên ba thao tác trả entity cần assertion trực tiếp Promise<TEntity>.
 *
 * @template TEntity Kiểu dữ liệu của Entity (ví dụ: Product)
 * @template TCreateDto Kiểu dữ liệu gửi lên khi tạo mới (mặc định Partial<TEntity>)
 * @template TUpdateDto Kiểu dữ liệu gửi lên khi cập nhật (mặc định Partial<TEntity>)
 * @template TFilterParams Kiểu dữ liệu tham số lọc và phân trang (mặc định Record<string, unknown>)
 *
 * @param {BaseServiceConfig<TEntity, TCreateDto, TUpdateDto, TFilterParams>} config Cấu hình endpoint và các hàm override tùy chọn
 * @returns {BaseService<TEntity, TCreateDto, TUpdateDto, TFilterParams>} Bộ service CRUD hoàn chỉnh
 *
 * @example
 * ```ts
 * interface Product { id: number; name: string; price: number; }
 * interface CreateProductDto { name: string; price: number; }
 * interface ProductFilter { searchTerm?: string; pageIndex?: number; }
 *
 * export const productService = createBaseService<Product, CreateProductDto, CreateProductDto, ProductFilter>({
 *   endpoint: "/products",
 * });
 * ```
 */
export function createBaseService<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
  TFilterParams = Record<string, unknown>,
>(
  config: BaseServiceConfig<TEntity, TCreateDto, TUpdateDto, TFilterParams>,
): BaseService<TEntity, TCreateDto, TUpdateDto, TFilterParams> {
  const axios = config.axios ?? apiClient;
  const endpoint = config.endpoint;

  return {
    getAll:
      config.getAll ??
      (async (params?: TFilterParams) => {
        return axios.get<PaginatedList<TEntity>, PaginatedList<TEntity>>(endpoint, {
          params,
        });
      }),

    getById:
      config.getById ??
      (async (id: string | number) => {
        return axios.get<TEntity, TEntity>(`${endpoint}/${id}`) as Promise<TEntity>;
      }),

    create:
      config.create ??
      (async (data: TCreateDto) => {
        return axios.post<TEntity, TEntity, TCreateDto>(endpoint, data) as Promise<TEntity>;
      }),

    update:
      config.update ??
      (async (id: string | number, data: TUpdateDto) => {
        return axios.put<TEntity, TEntity, TUpdateDto>(
          `${endpoint}/${id}`,
          data,
        ) as Promise<TEntity>;
      }),

    remove:
      config.remove ??
      (async (id: string | number) => {
        await axios.delete<void, void>(`${endpoint}/${id}`);
      }),

    getSelectOptions:
      config.getSelectOptions ??
      (async () => {
        return axios.get<SelectOption[], SelectOption[]>(`${endpoint}/select-options`);
      }),
  };
}
