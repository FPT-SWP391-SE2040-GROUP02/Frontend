import { vietnamDayOf } from "../model/handover.format";
import type { SubmissionDraft } from "../model/submissionForm";

/** Ô vàng người nhận điền trực tiếp trên văn bản. */
const FIELD =
  "h-9 rounded-lg border border-[#E0C486] bg-[#FFF6D8] px-3 text-sm font-semibold text-heritage-primary outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold/40";

/** Chỗ hệ thống chưa có dữ liệu ở bước này, để chấm như mẫu giấy. */
const BLANK = "..............................";
const BLANK_SHORT = "...............";

export interface SubmissionDocumentProps {
  draft: SubmissionDraft;
  onChange: <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => void;
  /** Giờ máy chủ của lượt, dùng cho dòng "Hôm nay, ngày ...". */
  serverTime: string;
}

function Letterhead({ title }: { title: string }) {
  return (
    <>
      <p className="text-center font-bold uppercase">Cộng hoà xã hội chủ nghĩa Việt Nam</p>
      <p className="text-center font-bold">Độc lập - Tự do - Hạnh phúc</p>
      <p className="text-center">-----------------</p>
      <h4 className="mt-4 mb-4 text-center text-lg font-bold uppercase">{title}</h4>
    </>
  );
}

function Signature({ title }: { title: string }) {
  return (
    <div className="mt-5 text-center">
      <p className="font-bold">{title}</p>
      <p>(Ký/điểm chỉ và ghi rõ họ tên)</p>
    </div>
  );
}

function NameField({ draft, onChange }: Pick<SubmissionDocumentProps, "draft" | "onChange">) {
  return (
    <input
      aria-label="Họ tên"
      value={draft.fullName}
      maxLength={200}
      onChange={(event) => onChange("fullName", event.target.value)}
      className={`${FIELD} w-64 max-w-full`}
    />
  );
}

/**
 * Văn bản từ chối nhận di sản thừa kế theo mẫu giấy của nhóm. Họ tên, ngày sinh và số căn cước là ô vàng;
 * Chủ kho, ngày mất, tên gói để chấm vì bước xác minh chưa được xem các thông tin này.
 */
function DeclineText({ draft, onChange, serverTime }: SubmissionDocumentProps) {
  const today = vietnamDayOf(serverTime);
  return (
    <>
      <Letterhead title="Văn bản từ chối nhận di sản thừa kế" />
      <p>
        Hôm nay, ngày {today.day} tháng {today.month} năm {today.year}, tại hệ thống LegacyVault,
        chúng tôi gồm:
      </p>
      <p>
        1. Ông/bà: <NameField draft={draft} onChange={onChange} /> Sinh ngày:{" "}
        <input
          aria-label="Ngày sinh"
          type="date"
          value={draft.dateOfBirth}
          onChange={(event) => onChange("dateOfBirth", event.target.value)}
          className={`${FIELD} w-44`}
        />
      </p>
      <p>
        CMND số:{" "}
        <input
          aria-label="Số căn cước"
          inputMode="numeric"
          maxLength={12}
          value={draft.citizenId}
          onChange={(event) => onChange("citizenId", event.target.value.replace(/\D/g, ""))}
          className={`${FIELD} w-44 font-mono tracking-wider`}
        />{" "}
        do Công an {BLANK_SHORT} cấp ngày {BLANK_SHORT}
      </p>
      <p>(Là người được chỉ định nhận của người để lại di sản thừa kế)</p>
      <p>Chúng tôi là những người thừa kế của ông/bà {BLANK}</p>
      <p>
        Ông/bà {BLANK} chết ngày {BLANK_SHORT} theo giấy chứng tử do UBND {BLANK_SHORT} đăng ký khai
        tử ngày {BLANK_SHORT}.
      </p>
      <p>
        Di sản mà ông/bà {BLANK} để lại là: {BLANK}
      </p>
      <p>
        Nay bằng Văn bản này chúng tôi tự nguyện từ chối nhận kỷ phần thừa kế di sản nêu trên mà
        chúng tôi được hưởng.
      </p>
      <p className="pl-6 font-bold">Chúng tôi xin cam đoan:</p>
      <p>- Những thông tin về nhân thân, về tài sản đã ghi trong văn bản này là đúng sự thật.</p>
      <p>
        - Việc từ chối nhận tài sản thừa kế này không nhằm trốn tránh việc thực hiện nghĩa vụ tài
        sản của mình đối với người khác.
      </p>
      <p>
        - Chúng tôi đã đọc nội dung Văn bản này, đã hiểu rõ trách nhiệm pháp lý của mình khi lập và
        ký/điểm chỉ vào Văn bản này.
      </p>
      <Signature title="Người lập Văn bản từ chối nhận di sản thừa kế" />
    </>
  );
}

/** Biên bản đồng ý nhận di sản thừa kế theo mẫu giấy của nhóm. Chỉ họ tên là ô vàng; Chủ kho, ngày mất, tên gói để chấm. */
function AcceptText({ draft, onChange, serverTime }: SubmissionDocumentProps) {
  const today = vietnamDayOf(serverTime);
  return (
    <>
      <Letterhead title="Biên bản đồng ý nhận di sản thừa kế" />
      <p>
        Hôm nay, ngày {today.day} tháng {today.month} năm {today.year}, tại hệ thống LegacyVault.
      </p>
      <p>
        Tôi là: <NameField draft={draft} onChange={onChange} />.
      </p>
      <p>Bằng biên bản này, tôi xin khai đúng sự thật rằng:</p>
      <p>
        1. Người để lại di sản: Chủ kho {BLANK}, chết ngày {BLANK_SHORT} theo giấy chứng tử đã được
        Người xét duyệt trong hệ thống, đăng ký khai tử ngày {BLANK_SHORT}.
      </p>
      <p>2. Tôi là người được Chủ kho chỉ định nhận phần di sản nêu tại mục 4.</p>
      <p>
        3. Tôi không thuộc các trường hợp không được quyền hưởng di sản, và trước khi lập biên bản
        này tôi chưa lập văn bản từ chối nhận di sản đối với phần này.
      </p>
      <p>4. Di sản khai nhận: {BLANK}.</p>
      <p>
        5. Tôi xin cam đoan những điều khai trong biên bản này là đúng sự thật, không khai thiếu,
        không giấu thông tin. Nếu sai, tôi hoàn toàn chịu trách nhiệm trước pháp luật.
      </p>
      <p>
        6. Nay, bằng biên bản này tôi đồng ý nhận phần di sản nêu tại mục 4. Tôi hiểu rằng người
        thừa kế chỉ phải thực hiện nghĩa vụ tài sản của người chết trong phạm vi di sản được nhận,
        tự chịu trách nhiệm về việc quản lý, sử dụng tài sản đã nhận và giữ kín khóa mở gói.
      </p>
      <p>
        7. Tôi đã đọc lại toàn bộ nội dung, hiểu rõ, chấp nhận và nhận thức đầy đủ trách nhiệm pháp
        lý của mình khi lập và xác nhận biên bản này.
      </p>
      <Signature title="Người lập Biên bản đồng ý nhận di sản thừa kế" />
    </>
  );
}

/**
 * Văn bản người nhận điền khi chọn Chấp nhận hoặc Từ chối. Nội dung theo hai mẫu giấy của nhóm, chỉ các
 * ô vàng là dữ liệu của người nhận; dữ liệu chưa được phép xem ở bước này để dòng chấm.
 */
export function SubmissionDocument(props: SubmissionDocumentProps) {
  const decline = props.draft.kind === "DECLINE";
  return (
    <article
      aria-label={decline ? "Văn bản từ chối nhận di sản" : "Biên bản đồng ý nhận di sản"}
      className="space-y-2 rounded-xl border border-heritage-border bg-white px-6 py-7 text-[15px] leading-8 text-[#111] sm:px-10 [&_p]:text-justify"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      {decline ? <DeclineText {...props} /> : <AcceptText {...props} />}
    </article>
  );
}
