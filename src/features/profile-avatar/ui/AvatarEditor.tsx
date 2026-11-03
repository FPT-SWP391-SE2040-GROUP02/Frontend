import { useRef, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { avatarService, UserAvatar } from "@/entities/user";
import { setUser, type AuthState } from "@/entities/user/model/authSlice";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { AVATAR_ACCEPTED_TYPES, avatarFileProblem } from "../model/avatar.rules";

/**
 * Đổi hoặc xóa ảnh đại diện của người đang đăng nhập. Chỉ cập nhật phiên sau khi Backend xác nhận;
 * ảnh không lưu ở Web Storage. Lỗi từ Backend (sai loại, quá dung lượng) hiện đúng câu Backend trả.
 */
export function AvatarEditor() {
  const dispatch = useDispatch();
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const action = usePrivateAction();
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState("");

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cho phép chọn lại đúng tệp đó lần sau.
    event.target.value = "";
    if (!file) return;
    const early = avatarFileProblem(file);
    if (early) {
      setProblem(early);
      return;
    }
    setProblem("");
    void action.execute(
      () => avatarService.upload(file),
      (updated) => dispatch(setUser(updated)),
    );
  };

  const onRemove = () => {
    setProblem("");
    void action.execute(
      () => avatarService.remove(),
      (updated) => dispatch(setUser(updated)),
    );
  };

  const hasAvatar = user?.hasAvatar === true;
  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        user={user}
        fallbackLetter="?"
        className="size-16 bg-heritage-primary text-2xl text-heritage-surface"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending || !user}
            onClick={() => input.current?.click()}
          >
            {action.pending ? "Đang lưu…" : hasAvatar ? "Đổi ảnh" : "Thêm ảnh"}
          </button>
          {hasAvatar && (
            <button
              type="button"
              className={buttonStyles.danger}
              disabled={action.pending}
              onClick={onRemove}
            >
              Xóa ảnh
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          hidden
          accept={AVATAR_ACCEPTED_TYPES.join(",")}
          aria-label="Chọn ảnh đại diện"
          onChange={onPick}
        />
        <p className="mt-2 text-xs text-heritage-muted">JPEG, PNG hoặc WebP, tối đa 2 MB.</p>
        {(problem || action.error) && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {problem || action.error}
          </p>
        )}
        {action.succeeded && !action.error && !problem && (
          <p role="status" className="mt-2 text-sm text-[#1F7A55]">
            Đã cập nhật ảnh đại diện.
          </p>
        )}
      </div>
    </div>
  );
}
