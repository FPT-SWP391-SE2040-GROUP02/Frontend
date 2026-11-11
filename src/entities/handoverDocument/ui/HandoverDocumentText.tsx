import type { ReactNode } from "react";
import { formatDocumentDate, vietnamDayOf } from "../model/handoverDocument.format";
import { buildTemplateValues, splitTemplateText } from "../model/templateFill";
import type { HandoverDocument, TemplateParagraph } from "../model/handoverDocument.schema";

const DOTS = "..............................";

function Placeholder({ children }: { children: ReactNode }) {
  return <span className="italic text-[#8a6a2c]">({children})</span>;
}

/** Giá trị đã điền thì hiện chữ; chưa điền thì hiện chú thích (khi blank) hoặc dòng chấm. */
function Fill({
  value,
  blank,
  hint,
  dots = DOTS,
}: {
  value: string | null | undefined;
  blank: boolean;
  hint: string;
  dots?: string;
}) {
  if (value) return <>{value}</>;
  return blank ? <Placeholder>{hint}</Placeholder> : <>{dots}</>;
}

function Signature({
  title,
  name,
  signedAt,
}: {
  title: string;
  name: string;
  signedAt: string | null;
}) {
  return (
    <div className="space-y-1 text-center text-[13px]">
      <p className="font-bold">{title}</p>
      <p>{name || "…"}</p>
      <p className={signedAt ? "text-[12px] text-[#1f5d44]" : "text-[12px] italic text-[#8a6a2c]"}>
        {signedAt ? `Đã ký điện tử ${formatSigned(signedAt)}` : "(chưa ký)"}
      </p>
    </div>
  );
}

function formatSigned(instant: string): string {
  const day = vietnamDayOf(instant);
  const time = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
  return `${time} ${day.day}/${day.month}/${day.year}`;
}

/** Một đoạn của mẫu: điền trường {…} từ dữ liệu biên bản; trường chưa có giá trị hiện chú thích (blank) hoặc dòng chấm. */
function TemplateLine({
  paragraph,
  values,
  blank,
}: {
  paragraph: TemplateParagraph;
  values: ReturnType<typeof buildTemplateValues>;
  blank: boolean;
}) {
  let boldClass = "";
  if (paragraph.bold) boldClass = "font-bold";
  return (
    <p className={boldClass} style={{ whiteSpace: "pre-wrap", textAlign: paragraph.align }}>
      {splitTemplateText(paragraph.text).map((part, index) => {
        if (part.kind === "text") return <span key={index}>{part.value}</span>;
        if (!Object.hasOwn(values, part.name)) return <span key={index}>{`{${part.name}}`}</span>;
        const value = values[part.name];
        if (value) return <span key={index}>{value}</span>;
        if (blank) return <Placeholder key={index}>bạn điền sau</Placeholder>;
        return <span key={index}>{DOTS}</span>;
      })}
    </p>
  );
}

/**
 * Toàn văn biên bản đồng ý nhận hoặc văn bản từ chối, điền từ dữ liệu của biên bản: Phần 1 chép từ hồ sơ chứng tử đã duyệt,
 * Phần 2 do người nhận khai, chữ ký của người nhận và Người xét duyệt.
 * blank: biên bản chưa hoàn tất, phần người nhận chưa khai hiện chú thích thay vì dòng chấm.
 * Nội dung theo hai mẫu giấy của nhóm; khớp ảnh văn bản Backend dựng lúc hoàn tất.
 */
export function HandoverDocumentText({
  document,
  blank = false,
}: {
  document: HandoverDocument;
  blank?: boolean;
}) {
  const { owner: deceased, recipient, verifier } = document;
  const day = vietnamDayOf(recipient.signedAt ?? document.createdAt);
  const owner = deceased.fullName || DOTS;
  const death = formatDocumentDate(deceased.dateOfDeath);
  const issued = formatDocumentDate(deceased.certificateIssuedOn);
  const container = document.containerName
    ? `${document.containerName} (gồm ${document.itemCount} mục)`
    : DOTS;
  const name = recipient.fullName;
  // Nơi đăng ký khai tử Người thực thi đã chọn; hồ sơ cũ chưa có thì in dòng chấm như ảnh văn bản Backend dựng.
  const place = deceased.deathRegistrationPlace || "UBND …………………";
  const accept = document.kind === "ACCEPT";
  // Backend mới trả các đoạn của mẫu đã ghi lúc tạo biên bản: dựng theo mẫu đó. Backend cũ thì dùng chữ cố định bên dưới.
  const template = document.templateParagraphs;
  if (template && template.length > 0) {
    const values = buildTemplateValues(document);
    return (
      <article
        aria-label={
          accept ? "Biên bản đồng ý nhận di sản thừa kế" : "Văn bản từ chối nhận di sản thừa kế"
        }
        className="max-w-2xl space-y-2 rounded-xl border border-heritage-border bg-white px-6 py-7 text-[14px] leading-6 text-black sm:px-10 [&_p:not(.text-center)]:text-justify"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        {template.map((paragraph, index) => (
          <TemplateLine key={index} paragraph={paragraph} values={values} blank={blank} />
        ))}
        <div className="grid gap-3 pt-4 sm:grid-cols-2">
          <Signature title="Người lập văn bản" name={name} signedAt={recipient.signedAt} />
          <Signature
            title="Người xét duyệt đã kiểm tra thủ công"
            name={verifier.signedByName}
            signedAt={verifier.signedAt}
          />
        </div>
      </article>
    );
  }
  return (
    <article
      aria-label={
        accept ? "Biên bản đồng ý nhận di sản thừa kế" : "Văn bản từ chối nhận di sản thừa kế"
      }
      className="max-w-2xl space-y-2 rounded-xl border border-heritage-border bg-white px-6 py-7 text-[14px] leading-6 text-black sm:px-10 [&_p:not(.text-center)]:text-justify"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <p className="text-center font-bold uppercase">Cộng hoà xã hội chủ nghĩa Việt Nam</p>
      <p className="text-center font-bold">Độc lập - Tự do - Hạnh phúc</p>
      <p className="text-center">-----------------</p>
      {accept ? (
        <>
          <h4 className="py-2 text-center text-base font-bold uppercase">
            Biên bản đồng ý nhận di sản thừa kế
          </h4>
          <p>
            Hôm nay, ngày {day.day} tháng {day.month} năm {day.year}, tại hệ thống LegacyVault.
          </p>
          <p>
            Tôi là: <Fill value={name} blank={blank} hint="bạn điền sau" />; sinh năm:{" "}
            {recipient.birthYear ?? (blank ? <Placeholder>bạn điền sau</Placeholder> : "......")};
            Số Căn cước/CCCD:{" "}
            <Fill
              value={recipient.citizenId || recipient.citizenIdLast4}
              blank={blank}
              hint="bạn điền sau"
              dots="............"
            />
            .
          </p>
          <p>Bằng biên bản này, tôi xin khai đúng sự thật rằng:</p>
          <p>
            1. Người để lại di sản: Chủ kho {owner}, chết ngày {death} theo giấy chứng tử do {place}{" "}
            đăng ký khai tử ngày {issued}. Thông tin này đã được Người xét duyệt thẩm định trên hệ
            thống.
          </p>
          <p>2. Tôi là người được Chủ kho chỉ định nhận phần di sản nêu tại mục 4.</p>
          <p>
            3. Tôi không thuộc các trường hợp không được quyền hưởng di sản theo Điều 621 Bộ luật
            Dân sự 2015, và trước khi lập biên bản này tôi chưa lập văn bản từ chối nhận di sản đối
            với phần này.
          </p>
          <p>4. Di sản khai nhận: {container}.</p>
          <p>
            5. Tôi xin cam đoan những điều khai trong biên bản này là đúng sự thật, không khai
            thiếu, không giấu thông tin. Nếu sai, tôi hoàn toàn chịu trách nhiệm trước pháp luật.
          </p>
          <p>
            6. Nay, bằng biên bản này tôi đồng ý nhận phần di sản nêu tại mục 4. Tôi hiểu rằng người
            thừa kế chỉ phải thực hiện nghĩa vụ tài sản của người chết trong phạm vi di sản được
            nhận theo Điều 615 Bộ luật Dân sự 2015, tự chịu trách nhiệm về việc quản lý, sử dụng tài
            sản đã nhận và bảo mật mã khóa giải mã dữ liệu được bàn giao.
          </p>
          <p>
            7. Tôi đã đọc lại toàn bộ nội dung, hiểu rõ, chấp nhận và nhận thức đầy đủ trách nhiệm
            pháp lý của mình khi lập và xác nhận biên bản này.
          </p>
          {document.declineNotice && <p>8. Tôi đã được thông báo: {document.declineNotice}</p>}
        </>
      ) : (
        <>
          <h4 className="py-2 text-center text-base font-bold uppercase">
            Văn bản từ chối nhận di sản thừa kế
          </h4>
          <p>
            Hôm nay, ngày {day.day} tháng {day.month} năm {day.year}, tại hệ thống LegacyVault, tôi
            là:
          </p>
          <p>
            1. Ông/bà: <Fill value={name} blank={blank} hint="bạn điền sau" /> Sinh năm:{" "}
            {recipient.birthYear ?? (blank ? <Placeholder>bạn điền sau</Placeholder> : "......")};
            Số Căn cước/CCCD:{" "}
            <Fill
              value={recipient.citizenId || recipient.citizenIdLast4}
              blank={blank}
              hint="bạn điền sau"
              dots="............"
            />{" "}
            do Bộ Công an cấp.
          </p>
          <p>(Là người được chỉ định nhận của người để lại di sản thừa kế)</p>
          <p>Tôi là người thừa kế của ông/bà {owner}</p>
          <p>
            Ông/bà {owner} chết ngày {death} theo giấy chứng tử do {place} đăng ký khai tử ngày{" "}
            {issued}.
          </p>
          <p>
            Di sản mà ông/bà {owner} để lại là: {container}
          </p>
          <p>
            Nay bằng Văn bản này tôi tự nguyện từ chối nhận kỷ phần thừa kế di sản nêu trên mà tôi
            được hưởng.
          </p>
          <p className="pl-8 font-bold">Tôi xin cam đoan:</p>
          <p>
            - Những thông tin về nhân thân, về tài sản đã ghi trong văn bản này là đúng sự thật.
          </p>
          <p>
            - Việc từ chối nhận tài sản thừa kế này không nhằm trốn tránh việc thực hiện nghĩa vụ
            tài sản của mình đối với người khác theo Điều 620 Bộ luật Dân sự 2015.
          </p>
          <p>
            - Tôi đã đọc nội dung Văn bản này, đã hiểu rõ trách nhiệm pháp lý của mình khi lập và ký
            vào Văn bản này.
          </p>
          <p>Văn bản này được gửi đến Người thực thi của kho, là người quản lý di sản, để biết.</p>
        </>
      )}
      <div className="grid gap-3 pt-4 sm:grid-cols-2">
        <Signature title="Người lập văn bản" name={name} signedAt={recipient.signedAt} />
        <Signature
          title="Người xét duyệt đã kiểm tra thủ công"
          name={verifier.signedByName}
          signedAt={verifier.signedAt}
        />
      </div>
    </article>
  );
}
