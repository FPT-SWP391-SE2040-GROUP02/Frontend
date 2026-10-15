import { useState } from "react";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ekycDocumentSchema } from "../model/ekyc.schema";
import { ekycService } from "../api/ekycService";

/** Quy trình document → đọc OCR trong RAM → xác nhận → selfie; không upload tự động. */
export function EkycUploads() {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [document, setDocument] = useState<z.infer<typeof ekycDocumentSchema> | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState("");
  return (
    <section className="space-y-4 border-t border-heritage-border pt-6">
      <h2 className="text-lg font-semibold">
        {document ? "Bước 2: So khớp khuôn mặt" : "Bước 1: Ảnh mặt trước CCCD"}
      </h2>
      <p className="text-sm leading-6 text-heritage-muted">
        Ảnh được gửi tới hệ thống và dịch vụ xác minh danh tính đã cấu hình khi bạn bấm gửi. Chọn
        JPEG hoặc PNG, tối đa 8 MiB. Không gửi giấy tờ của người khác.
      </p>
      {document && (
        <div className="space-y-3 rounded-lg border border-heritage-border p-4 text-sm">
          <p>
            {document.fullName} · {document.dateOfBirth}
          </p>
          <p>CCCD: ****{document.idNumber.slice(-4)}</p>
          <p>
            Hạn bước so khớp:{" "}
            {document.expiresAt ? new Date(document.expiresAt).toLocaleString("vi-VN") : "Chưa có"}
          </p>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="size-5"
              checked={confirmed}
              disabled={action.pending}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            Tôi đã kiểm tra thông tin đọc được từ giấy tờ.
          </label>
          {!document.canMatchFace && (
            <p role="alert">Máy chủ chưa cho phép so khớp. Hãy bắt đầu lại với ảnh rõ hơn.</p>
          )}
          <Button
            variant="outline"
            disabled={action.pending}
            onClick={() => {
              setDocument(null);
              setImage(null);
              setConfirmed(false);
            }}
          >
            Bắt đầu lại với giấy tờ khác
          </Button>
        </div>
      )}
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setValidation("");
          if (
            !image ||
            image.size === 0 ||
            image.size > 8 * 1024 * 1024 ||
            !["image/jpeg", "image/png"].includes(image.type)
          ) {
            setValidation("Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.");
            return;
          }
          const form = event.currentTarget;
          const saved = document
            ? await action.execute(
                () => ekycService.matchFace(image),
                (result) => {
                  client.setQueryData(["ekyc", "me"], result);
                  void client.invalidateQueries({ queryKey: ["ekyc"] });
                  setDocument(null);
                  setConfirmed(false);
                },
              )
            : await action.execute(
                () => ekycService.submitDocument(image),
                (result) => {
                  setDocument(result);
                  setConfirmed(false);
                  void client.invalidateQueries({ queryKey: ["ekyc"] });
                },
              );
          if (saved) {
            setImage(null);
            form.reset();
          }
        }}
      >
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="block space-y-2 text-sm">
            {document ? "Ảnh selfie" : "Ảnh mặt trước giấy tờ"}
            <Input
              key={document?.verificationId ?? "document"}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            type="submit"
            disabled={document !== null && (!document.canMatchFace || !confirmed)}
            className="min-h-11"
          >
            {action.pending
              ? "Đang xác minh…"
              : document
                ? "Gửi ảnh selfie để so khớp"
                : "Gửi ảnh giấy tờ"}
          </Button>
        </fieldset>
      </form>
      {(validation || action.error) && (
        <p role="alert" className="text-sm text-destructive">
          {validation || action.error}
        </p>
      )}
      {action.succeeded && (
        <p role="status" className="text-sm text-heritage-primary">
          Đã nhận phản hồi từ máy chủ. Kết quả xác minh hiển thị ở trạng thái phía trên.
        </p>
      )}
    </section>
  );
}
