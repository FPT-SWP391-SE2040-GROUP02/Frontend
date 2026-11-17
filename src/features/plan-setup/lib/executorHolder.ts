import type { z } from "zod";
import type { executorSchema } from "../model/planSetup.schema";

type Executor = z.infer<typeof executorSchema>;

function isLive(executor: Executor): boolean {
  return (
    executor.status === "INVITED" ||
    executor.status === "ACCEPTED" ||
    executor.status === "SUSPENDED"
  );
}

/** Người đang giữ vai: ưu tiên người đã đồng ý (người thay đang chờ không thay họ cho tới khi đồng ý). */
export function currentHolder(executors: Executor[]): Executor | null {
  let holder: Executor | null = null;
  for (const executor of executors) {
    if (!isLive(executor)) {
      continue;
    }
    if (holder === null || executor.status === "ACCEPTED") {
      holder = executor;
    }
  }
  return holder;
}
