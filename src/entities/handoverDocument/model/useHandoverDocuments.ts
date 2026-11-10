import { useQuery } from "@tanstack/react-query";
import { handoverDocumentService } from "../api/handoverDocumentService";

export const handoverDocumentKeys = {
  all: ["handover-document"] as const,
  mine: () => [...handoverDocumentKeys.all, "mine"] as const,
  executor: () => [...handoverDocumentKeys.all, "executor"] as const,
  verifier: () => [...handoverDocumentKeys.all, "verifier"] as const,
  turn: (turnId: string) => [...handoverDocumentKeys.all, "turn", turnId] as const,
};

/** Biên bản của một lượt (null khi chưa bắt đầu). Không retry để lỗi hiện ngay. */
export function useTurnDocument(turnId: string, enabled = true) {
  return useQuery({
    queryKey: handoverDocumentKeys.turn(turnId),
    queryFn: ({ signal }) => handoverDocumentService.getByTurn(turnId, signal),
    enabled,
    retry: false,
  });
}

export function useMyDocuments() {
  return useQuery({
    queryKey: handoverDocumentKeys.mine(),
    queryFn: ({ signal }) => handoverDocumentService.listMine(signal),
    retry: false,
  });
}

export function useExecutorDocuments() {
  return useQuery({
    queryKey: handoverDocumentKeys.executor(),
    queryFn: ({ signal }) => handoverDocumentService.listForExecutor(signal),
    retry: false,
  });
}

export function useVerifierDocuments() {
  return useQuery({
    queryKey: handoverDocumentKeys.verifier(),
    queryFn: ({ signal }) => handoverDocumentService.listForVerifier(signal),
    retry: false,
  });
}
