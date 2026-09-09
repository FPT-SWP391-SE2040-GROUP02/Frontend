import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

/**
 * @description Hook Typed Dispatch được định kiểu sẵn từ Redux Store.
 * Sử dụng thay thế cho useDispatch thông thường để đảm bảo an toàn kiểu dữ liệu.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * @description Hook Typed Selector được định kiểu sẵn từ RootState.
 * Sử dụng thay thế cho useSelector thông thường.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
