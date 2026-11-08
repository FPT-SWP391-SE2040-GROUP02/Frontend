import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft, Printer } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { caseCode } from "../model/caseCode";
import { REVIEW_CHECKS } from "../model/reviewChecks";
import { decisionLabels } from "../model/verifierReview.schema";
import { useVerifierCase } from "../model/useVerifierReview";

const KIND_LABELS = {
  DEATH_CERTIFICATE: "Giấy chứng tử",
  DEATH_NOTICE: "Giấy báo tử / giấy thay thế",
} as const;

const SERIF = "[font-family:Georgia,'Times_New_Roman',serif]";
const TH =
  "border border-[#D9D3C0] bg-[#F7F4EA] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#4B5B53]";
const TD = "border border-[#D9D3C0] px-3 py-2 align-top";

/**
 * Văn bản làm căn cứ và nguồn tham khảo của biên bản. Chỉ dùng để tham khảo thể thức và cơ sở nghiệp vụ;
 * nội dung điều khoản chưa đối chiếu với bản gốc trên Công báo.
 */
const LEGAL_BASES = [
  {
    id: "ho-tich",
    name: "Luật Hộ tịch số 60/2014/QH13",
    note: " (quy định về đăng ký khai tử, Điều 32 đến Điều 34)",
    usage: "cơ sở của giấy chứng tử, giấy báo tử và giấy tờ thay thế trong hồ sơ",
    url: "https://hethongphapluat.com/luat-ho-tich-2014/dieu-34",
  },
  {
    id: "gdd-tu",
    name: "Luật Giao dịch điện tử số 20/2023/QH15",
    note: " (giá trị của thông điệp dữ liệu, có hiệu lực từ 01/7/2024)",
    usage: "cơ sở cho việc lập và lưu biên bản dưới dạng thông điệp dữ liệu",
    url: "https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Giao-dich-dien-tu-2023-20-2023-QH15-513347.aspx",
  },
  {
    id: "van-thu",
    name: "Nghị định số 30/2020/NĐ-CP về công tác văn thư",
    note: " (thể thức và kỹ thuật trình bày văn bản)",
    usage: "tham khảo bố cục quốc hiệu, số ký hiệu, ngày tháng, căn cứ, nơi nhận",
    url: "https://thuvienphapluat.vn/van-ban/bo-may-hanh-chinh/decree-30-2020-nd-cp-records-management-472077.aspx",
  },
  {
    id: "du-lieu-ca-nhan",
    name: "Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân",
    note: " (có hiệu lực từ 01/7/2023)",
    usage: "cơ sở cho việc che bớt số căn cước công dân của chủ kho trên biên bản",
    url: "https://vanban.vcci.com.vn/nghi-dinh-132023nd-cp-ve-bao-ve-du-lieu-ca-nhan",
  },
] as const;

/** Ngày tháng theo thể thức văn bản hành chính: "ngày 07 tháng 11 năm 2026" (giờ Việt Nam). */
function formatLongDate(value: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(value));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `Lập ngày ${pick("day")} tháng ${pick("month")} năm ${pick("year")}`;
}

/** Che giữa số CCCD: giữ 3 số đầu và 3 số cuối. */
function maskCitizenId(value: string | null): string {
  if (!value) return "—";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}•••${value.slice(-3)}`;
}

const formatBirth = (value: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/** Mục của văn bản: số thứ tự và tên mục, kẻ chân vàng, không bị ngắt trang giữa chừng khi in. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 print:break-inside-avoid">
      <h3
        className={`${SERIF} border-b-2 border-[#B88E4C] pb-1 text-base font-bold uppercase tracking-wide text-[#0A281E]`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Bảng hai cột nhãn và giá trị, viền mảnh như mẫu văn bản hành chính. */
function InfoTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th
              scope="row"
              className="w-48 border border-[#D9D3C0] bg-[#F7F4EA] px-3 py-2 text-left font-medium text-[#4B5B53]"
            >
              {label}
            </th>
            <td className="border border-[#D9D3C0] px-3 py-2 font-semibold">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Biên bản thẩm định của một hồ sơ đã có quyết định cuối (duyệt hoặc từ chối), dựng hoàn toàn từ dữ liệu Backend
 * (mã biên bản, thời điểm quyết định, nhật ký). Trình bày như văn bản hành chính: giấy trắng, chữ có chân, bảng viền mảnh,
 * khung ký. Không chỉnh sửa được; có nút in (trình duyệt cho phép lưu thành PDF).
 */
export function VerifierRecord() {
  const [params] = useSearchParams();
  const caseId = params.get("caseId");
  const query = useVerifierCase(caseId);
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);

  const back = (
    <Link to={ROUTES.NOTARY.HISTORY} className={buttonStyles.outline}>
      <ChevronLeft className="size-4" aria-hidden="true" />
      Về Lịch sử
    </Link>
  );
  if (!caseId) {
    return (
      <div className="space-y-3">
        <p role="status">Chưa chọn hồ sơ. Mở biên bản từ Lịch sử.</p>
        {back}
      </div>
    );
  }
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được hồ sơ hoặc bạn không có quyền xem.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
        {back}
      </div>
    );
  }
  const detail = query.data;
  // Biên bản theo đúng trạng thái hiện tại của hồ sơ: đã duyệt thì lấy quyết định duyệt, bị từ chối thì lấy quyết định từ chối.
  // Dữ liệu lệch (trạng thái một đằng, quyết định một nẻo) thì không dựng biên bản sai.
  let finalKind: "APPROVED" | "REJECTED" | null = null;
  if (detail.status === "APPROVED_FOR_HANDOVER") finalKind = "APPROVED";
  if (detail.status === "REJECTED") finalKind = "REJECTED";
  const approval = detail.decisions.find(
    (decision) => decision.kind === finalKind && decision.recordCode,
  );
  if (!approval) {
    return (
      <div className="space-y-3">
        <p role="status">Hồ sơ này chưa có quyết định cuối nên chưa có biên bản thẩm định.</p>
        {back}
      </div>
    );
  }
  const review = detail.reviewVersion;
  const identity = detail.ownerIdentity;
  const rejected = approval.kind === "REJECTED";
  const eKycValues = [
    identity.fullName ?? "—",
    maskCitizenId(identity.citizenId),
    formatBirth(identity.dateOfBirth),
    "Đủ trang, có con dấu và chữ ký",
  ];
  const stampClass = rejected
    ? "border-[#A32119] text-[#A32119]"
    : "border-[#1F7A55] text-[#1F7A55]";
  return (
    <div className="rounded-2xl bg-[#F1EEE3] p-3 sm:p-6 print:bg-transparent print:p-0">
      <div className="mx-auto mb-4 flex max-w-[860px] flex-wrap items-center justify-between gap-3 print:hidden">
        {back}
        <button type="button" className={buttonStyles.dark} onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          In biên bản
        </button>
      </div>
      <article
        className={`${SERIF} relative mx-auto max-w-[860px] space-y-7 border border-[#D9D3C0] bg-white px-6 py-10 text-[#14241C] shadow-[0_8px_30px_rgba(10,40,30,0.12)] sm:px-14 print:max-w-none print:border-0 print:p-0 print:shadow-none`}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0A281E] via-[#B88E4C] to-[#0A281E]" />
        <header className="space-y-5 text-center">
          <div className="grid gap-4 text-xs sm:grid-cols-2">
            <div className="space-y-1">
              <p className="font-bold uppercase">Hệ thống LegacyVault</p>
              <p className="font-semibold uppercase">Bộ phận Người xét duyệt</p>
              <div className="mx-auto h-px w-16 bg-[#14241C]" />
              <p>
                Số: <span className="font-mono font-bold">{approval.recordCode}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
              <p className="font-bold">Độc lập - Tự do - Hạnh phúc</p>
              <div className="mx-auto h-px w-32 bg-[#14241C]" />
              <p className="italic">{formatLongDate(approval.decidedAt)}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-wide text-[#0A281E] sm:text-3xl">
            Biên bản thẩm định hồ sơ báo tin
          </h2>
          <p className="text-sm italic">
            V/v {rejected ? "từ chối" : "chấp thuận"} hồ sơ báo tin mã {caseCode(detail.id)}
          </p>
          <div className="flex justify-center">
            <div
              className={`rotate-[-3deg] border-2 px-3 py-1 text-xs font-bold uppercase tracking-widest ${stampClass}`}
            >
              {rejected ? "Từ chối · Hồ sơ đã đóng" : "Chấp thuận · Kho đã mở"}
            </div>
          </div>
        </header>

        <section aria-label="Căn cứ pháp lý" className="space-y-1 text-sm italic">
          {LEGAL_BASES.map((basis) => (
            <p key={basis.id}>
              - Căn cứ{" "}
              <a
                href={basis.url}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-dotted underline-offset-2"
              >
                {basis.name}
              </a>
              {basis.note};
            </p>
          ))}
          <p>
            - Căn cứ hồ sơ báo tin do Người thực hiện nộp và dữ liệu eKYC của chủ kho đã lưu trên hệ
            thống.
          </p>
        </section>

        <Section title="1. Hồ sơ được thẩm định">
          <InfoTable
            rows={[
              ["Mã hồ sơ", caseCode(detail.id)],
              ["Chủ kho", identity.fullName ?? "—"],
              ["Số CCCD chủ kho", maskCitizenId(identity.citizenId)],
              ["Người nộp", detail.executor?.fullName ?? "—"],
              ["Nộp hồ sơ lúc", review.submittedAt ? formatDateTime(review.submittedAt) : "—"],
              [
                "Số lần nộp",
                review.versionNo === 1 ? "1 (lần nộp đầu)" : `${review.versionNo} (bản nộp lại)`,
              ],
            ]}
          />
        </Section>

        {rejected ? (
          <Section title="2. Lý do từ chối">
            <p className="border-l-4 border-[#A32119] bg-[#FBEFED] px-4 py-3 text-sm font-semibold">
              {approval.reason}
            </p>
            <p className="text-sm text-[#4B5B53]">
              Hồ sơ đã đóng, kho vẫn khóa. Người nộp phải tạo hồ sơ mới từ đầu.
            </p>
          </Section>
        ) : (
          <Section title="2. Kết quả đối chiếu">
            <p className="text-sm text-[#4B5B53]">
              Nút duyệt chỉ mở khi người thẩm định đã tích đủ bốn mục dưới đây.
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={TH}>Mục kiểm tra</th>
                  <th className={TH}>Theo eKYC của chủ kho</th>
                  <th className={`${TH} w-24 text-center`}>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {REVIEW_CHECKS.map((check, index) => (
                  <tr key={check}>
                    <td className={TD}>{check}</td>
                    <td className={`${TD} font-semibold`}>{eKycValues[index]}</td>
                    <td className={`${TD} text-center font-bold text-[#1F7A55]`}>Đạt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        <Section title="3. Tài liệu đã thẩm định">
          {review.files.length === 0 ? (
            <p className="text-sm text-[#4B5B53]">Không có tệp.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`${TH} w-12 text-center`}>STT</th>
                  <th className={TH}>Loại giấy</th>
                  <th className={TH}>Tên tệp</th>
                  <th className={`${TH} w-28`}>Dung lượng</th>
                </tr>
              </thead>
              <tbody>
                {review.files.map((file, index) => (
                  <tr key={file.id}>
                    <td className={`${TD} text-center`}>{index + 1}</td>
                    <td className={`${TD} font-semibold`}>{KIND_LABELS[file.kind]}</td>
                    <td className={`${TD} break-all`}>{file.fileName}</td>
                    <td className={TD}>{formatStorageSize(file.sizeBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="4. Quyết định">
          <InfoTable
            rows={[
              [
                "Quyết định",
                rejected ? "Từ chối hồ sơ và đóng hồ sơ" : "Chấp thuận hồ sơ, mở gói tài sản",
              ],
              ["Người thẩm định", user?.fullName ?? "—"],
              ["Thời điểm", `${formatDateTime(approval.decidedAt)} (giờ Việt Nam)`],
            ]}
          />
        </Section>

        <Section title="5. Nhật ký thẩm định">
          <p className="text-sm text-[#4B5B53]">
            Hệ thống tự ghi mỗi quyết định của Người xét duyệt trên hồ sơ này. Không ai sửa hoặc xóa
            được.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={`${TH} w-40`}>Thời điểm</th>
                <th className={`${TH} w-44`}>Quyết định</th>
                <th className={TH}>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {detail.decisions.map((decision) => (
                <tr key={`${decision.kind}-${decision.versionNo}-${decision.decidedAt}`}>
                  <td className={TD}>{formatDateTime(decision.decidedAt)}</td>
                  <td className={`${TD} font-semibold`}>
                    v{decision.versionNo} · {decisionLabels[decision.kind]}
                  </td>
                  <td className={TD}>{decision.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div className="grid gap-8 pt-4 text-center text-sm sm:grid-cols-2 print:break-inside-avoid">
          <div className="space-y-12">
            <p className="font-bold uppercase tracking-wide">Người thẩm định</p>
            <div>
              <p className="font-semibold">{user?.fullName ?? "—"}</p>
              <p className="text-xs text-[#66786E]">
                Đã xác nhận quyết định bằng mật khẩu tài khoản
              </p>
            </div>
          </div>
          <div className="space-y-12">
            <p className="font-bold uppercase tracking-wide">Hệ thống LegacyVault</p>
            <div>
              <p className="font-mono font-semibold">{approval.recordCode}</p>
              <p className="text-xs text-[#66786E]">Lập tự động, không chỉnh sửa được</p>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs print:break-inside-avoid">
          <p className="font-bold italic">Nơi nhận:</p>
          <p>- Người thực hiện đã nộp hồ sơ;</p>
          <p>- Lưu: hồ sơ báo tin trên hệ thống LegacyVault.</p>
        </div>

        <section
          aria-label="Nguồn tham khảo"
          className="space-y-2 border-t border-[#D9D3C0] pt-4 text-xs text-[#4B5B53] print:break-inside-avoid"
        >
          <h3 className="font-bold uppercase tracking-wide">Nguồn tham khảo</h3>
          <ol className="list-decimal space-y-1 pl-5">
            {LEGAL_BASES.map((basis) => (
              <li key={basis.id}>
                {basis.name}: {basis.usage}.{" "}
                <a
                  href={basis.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="break-all underline"
                >
                  {basis.url}
                </a>
              </li>
            ))}
          </ol>
          <p>
            Lưu ý: đây là biên bản điện tử do hệ thống LegacyVault tạo tự động khi Người xét duyệt
            ra quyết định; không phải văn bản công chứng, chứng thực hay văn bản của cơ quan nhà
            nước, và không thay thế giấy chứng tử, giấy báo tử hay trích lục khai tử. Đây là đồ án
            học tập; các văn bản trích dẫn chỉ để tham khảo thể thức, chưa được đối chiếu với bản
            gốc trên Công báo, người dùng cần kiểm tra hiệu lực hiện hành trước khi dùng vào việc
            pháp lý.
          </p>
        </section>
      </article>
    </div>
  );
}
