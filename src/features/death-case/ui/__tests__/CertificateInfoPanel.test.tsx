import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { DeathCase } from "../../model/deathCase.schema";
import { DeathCaseEditor } from "../DeathCaseEditor";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
const CREATED_AT = "2026-11-01T00:00:00+00:00";

const PROVINCES = [
  { code: "01", name: "Thành phố Hà Nội" },
  { code: "79", name: "Thành phố Hồ Chí Minh" },
];
const WARDS: Record<string, Array<{ code: string; name: string }>> = {
  "01": [{ code: "00004", name: "Phường Ba Đình" }],
  "79": [
    { code: "26740", name: "Phường Sài Gòn" },
    { code: "26743", name: "Phường Bến Thành" },
  ],
};

interface VersionOverrides {
  dateOfDeath?: string | null;
  issuedOn?: string | null;
  deathRegistrationProvinceCode?: string | null;
  deathRegistrationWardCode?: string | null;
  deathRegistrationPlace?: string;
  withFile?: boolean;
  isDraft?: boolean;
}

function caseRecord(over: VersionOverrides = {}, etag = "case-v1"): DeathCase {
  const isDraft = over.isDraft !== false;
  const hasFile = over.withFile === true;
  const place = over.deathRegistrationPlace ?? "";
  return {
    id: CASE_ID,
    vaultId: VAULT_ID,
    status: isDraft ? "DRAFT" : "UNDER_REVIEW",
    currentVersion: {
      versionNo: 1,
      isDraft,
      ownerFullName: null,
      ownerCitizenIdLast4: null,
      dateOfDeath: over.dateOfDeath ?? null,
      certificateNumber: null,
      issuedOn: over.issuedOn ?? null,
      issuedBy: null,
      deathRegistrationProvinceCode: over.deathRegistrationProvinceCode ?? null,
      deathRegistrationWardCode: over.deathRegistrationWardCode ?? null,
      deathRegistrationPlace: place,
      files: hasFile
        ? [
            {
              id: FILE_ID,
              position: 1,
              kind: "DEATH_CERTIFICATE",
              fileName: "giay-chung-tu.pdf",
              contentType: "application/pdf",
              sizeBytes: 2048,
              uploadedAt: CREATED_AT,
            },
          ]
        : [],
      submittedAt: isDraft ? null : CREATED_AT,
    },
    reviewVersionNo: null,
    missingRequirements: hasFile ? [] : ["FILES"],
    ownerNotice: null,
    objectionEndsAt: null,
    createdAt: CREATED_AT,
    updatedAt: null,
    etag,
  };
}

function notFound(): AxiosError {
  return new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 404,
    statusText: "Not Found",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });
}

function badRequest(errors: Record<string, string[]>): AxiosError {
  return new AxiosError("Bad request", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code: "VALIDATION_ERROR", errors },
  });
}

/** Trả danh mục hành chính; mọi đường dẫn khác (đồng hồ demo, tham số công khai) là 404 để dùng mặc định. */
function mockCatalog() {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url === "/administrative-units/provinces") return PROVINCES;
    const match = /^\/administrative-units\/provinces\/([^/]+)\/wards$/.exec(url);
    if (match) return WARDS[match[1]] ?? [];
    throw notFound();
  });
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("executor-fixture");
  // Chỉ giả ngày, không giả bộ đếm giờ, để "hôm nay" cố định là 11/11/2026 (giờ Việt Nam).
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T05:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

/** Như trang thật: hồ sơ đọc từ cache truy vấn, nên sau khi lưu (setQueryData) ô nhận giá trị mới. */
function EditorFromCache({ initial }: { initial: DeathCase }) {
  const query = useQuery({
    queryKey: ["death-case", CASE_ID],
    queryFn: async () => client.getQueryData<DeathCase>(["death-case", CASE_ID]) ?? initial,
    initialData: initial,
    staleTime: Infinity,
  });
  return <DeathCaseEditor record={query.data} ownerName="Nguyễn Văn A" />;
}

function renderEditor(record: DeathCase) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <EditorFromCache initial={record} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

const deathInput = () => screen.getByLabelText("Ngày mất");
const issuedInput = () => screen.getByLabelText("Ngày đăng ký khai tử");
// Hai ô chọn là combobox có ô gõ lọc nằm trong danh sách thả xuống.
const provinceSelect = () => screen.getByRole("combobox", { name: "Tỉnh / thành phố" });
const wardSelect = () => screen.getByRole("combobox", { name: "Phường / xã" });

/** Mở danh sách của một ô chọn rồi bấm một mục theo tên. */
async function pick(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string,
) {
  await user.click(trigger);
  await user.click(await screen.findByRole("option", { name: optionName }));
}
const submitButton = () => screen.getByRole("button", { name: "Nộp hồ sơ" });
const preview = () => screen.getByTestId("certificate-preview");

describe("mục Thông tin trên giấy của Người thực thi", () => {
  it("nằm giữa mục tải giấy và mục cam đoan, có dòng giải thích và gợi ý ngày đăng ký", async () => {
    mockCatalog();
    renderEditor(caseRecord());

    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    const info = headings.indexOf("Thông tin trên giấy");
    expect(info).toBeGreaterThan(headings.indexOf("Soạn hồ sơ báo tin"));
    expect(info).toBeLessThan(headings.indexOf("Cam đoan và nộp hồ sơ"));
    expect(
      screen.getByText(/Chỉ cần 3 thông tin, nhìn trên giấy rồi điền đúng như giấy ghi/),
    ).toBeInTheDocument();
    expect(screen.getByText("Ngày ghi ở cuối giấy, cạnh chữ ký của UBND.")).toBeInTheDocument();
    // Ô ngày không cho chọn sau hôm nay.
    expect(deathInput()).toHaveAttribute("max", "2026-11-11");
    expect(issuedInput()).toHaveAttribute("max", "2026-11-11");
  });

  it("ngày mất ở tương lai báo lỗi ngay dưới ô và không gọi Backend", async () => {
    mockCatalog();
    const put = vi.spyOn(apiClient, "put");
    renderEditor(caseRecord());

    fireEvent.change(deathInput(), { target: { value: "2026-11-12" } });
    fireEvent.blur(deathInput());

    expect(await screen.findByText("Ngày mất không được sau hôm nay.")).toBeInTheDocument();
    expect(deathInput()).toHaveAttribute("aria-invalid", "true");
    expect(put).not.toHaveBeenCalled();
  });

  it("ngày đăng ký trước ngày mất báo lỗi dưới ô ngày đăng ký", async () => {
    mockCatalog();
    const put = vi.spyOn(apiClient, "put");
    renderEditor(caseRecord({ dateOfDeath: "2026-11-05" }));

    fireEvent.change(issuedInput(), { target: { value: "2026-11-04" } });
    fireEvent.blur(issuedInput());

    expect(
      await screen.findByText("Ngày đăng ký khai tử phải từ ngày mất trở đi."),
    ).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("phường/xã khóa tới khi chọn tỉnh, rồi mở và lưu cả hai mã", async () => {
    mockCatalog();
    const saved = caseRecord(
      { deathRegistrationProvinceCode: "79", deathRegistrationWardCode: null },
      "case-v2",
    );
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(saved);
    const user = userEvent.setup();
    renderEditor(caseRecord());

    expect(wardSelect()).toBeDisabled();
    expect(wardSelect()).toHaveTextContent("Chọn tỉnh trước");

    await waitFor(() => expect(provinceSelect()).toBeEnabled());
    await pick(user, provinceSelect(), "Thành phố Hồ Chí Minh");

    await waitFor(() => expect(wardSelect()).toBeEnabled());
    expect(put).toHaveBeenCalledWith(`/executor/death-cases/${CASE_ID}/draft`, {
      etag: "case-v1",
      deathRegistrationProvinceCode: "79",
      deathRegistrationWardCode: "",
    });
    await user.click(wardSelect());
    expect(await screen.findByRole("option", { name: "Phường Bến Thành" })).toBeInTheDocument();
  });

  it("ô gõ lọc nằm trong danh sách thả xuống, gõ không dấu cũng lọc được và chọn bằng bàn phím", async () => {
    mockCatalog();
    vi.spyOn(apiClient, "put").mockResolvedValue(
      caseRecord(
        { deathRegistrationProvinceCode: "79", deathRegistrationWardCode: "26743" },
        "case-v2",
      ),
    );
    const user = userEvent.setup();
    renderEditor(caseRecord({ deathRegistrationProvinceCode: "79" }));
    await waitFor(() => expect(wardSelect()).toBeEnabled());

    await user.click(wardSelect());

    // Ô gõ nằm cùng khung với danh sách, không nằm ngoài ô chọn.
    const listbox = await screen.findByRole("listbox", { name: "Gõ để lọc phường / xã" });
    const search = screen.getByRole("searchbox", { name: "Gõ để lọc phường / xã" });
    expect(listbox.parentElement).toContainElement(search);
    expect(screen.getAllByRole("option")).toHaveLength(2);

    await user.type(search, "ben thanh");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Phường Bến Thành" })).toBeInTheDocument();

    await user.keyboard("{Enter}");
    await waitFor(() => expect(wardSelect()).toHaveTextContent("Phường Bến Thành"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("gõ không khớp thì báo không có mục nào; Escape đóng danh sách", async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderEditor(caseRecord({ deathRegistrationProvinceCode: "79" }));
    await waitFor(() => expect(wardSelect()).toBeEnabled());

    await user.click(wardSelect());
    await user.type(screen.getByRole("searchbox", { name: "Gõ để lọc phường / xã" }), "zzz");
    expect(screen.getByText("Không có mục nào khớp.")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("đổi tỉnh thì xóa phường đã chọn ở ô và ở Backend", async () => {
    mockCatalog();
    const put = vi
      .spyOn(apiClient, "put")
      .mockResolvedValue(
        caseRecord(
          { deathRegistrationProvinceCode: "01", deathRegistrationWardCode: null },
          "case-v2",
        ),
      );
    const user = userEvent.setup();
    renderEditor(
      caseRecord({
        deathRegistrationProvinceCode: "79",
        deathRegistrationWardCode: "26743",
        deathRegistrationPlace: "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
      }),
    );
    await waitFor(() => expect(wardSelect()).toHaveTextContent("Phường Bến Thành"));

    await pick(user, provinceSelect(), "Thành phố Hà Nội");

    await waitFor(() => expect(wardSelect()).toHaveTextContent("Chọn phường / xã"));
    expect(put).toHaveBeenCalledWith(`/executor/death-cases/${CASE_ID}/draft`, {
      etag: "case-v1",
      deathRegistrationProvinceCode: "01",
      deathRegistrationWardCode: "",
    });
  });

  it("câu xem trước đổi theo từng ô: phần đã điền tô vàng, phần thiếu tô đỏ nhạt và hiện ……", async () => {
    mockCatalog();
    vi.spyOn(apiClient, "put").mockResolvedValue(caseRecord());
    renderEditor(caseRecord());

    expect(screen.getByText("Câu này sẽ được in vào biên bản của người nhận:")).toBeInTheDocument();
    expect(preview()).toHaveTextContent(
      "Ông/bà Nguyễn Văn A chết ngày …… theo giấy chứng tử do …… đăng ký khai tử ngày ……",
    );
    const blanks = Array.from(preview().querySelectorAll("mark"));
    expect(blanks.map((mark) => mark.dataset.filled)).toEqual(["false", "false", "false"]);

    fireEvent.change(deathInput(), { target: { value: "2026-11-05" } });
    fireEvent.change(issuedInput(), { target: { value: "2026-11-07" } });

    await waitFor(() =>
      expect(preview()).toHaveTextContent(
        "Ông/bà Nguyễn Văn A chết ngày 05/11/2026 theo giấy chứng tử do …… đăng ký khai tử ngày 07/11/2026",
      ),
    );
    const marks = Array.from(preview().querySelectorAll("mark"));
    expect(marks.map((mark) => mark.dataset.filled)).toEqual(["true", "false", "true"]);
  });

  it("câu xem trước ghép tên nơi đăng ký từ danh mục khi đã chọn tỉnh và phường", async () => {
    mockCatalog();
    renderEditor(
      caseRecord({
        dateOfDeath: "2026-11-05",
        issuedOn: "2026-11-07",
        deathRegistrationProvinceCode: "79",
        deathRegistrationWardCode: "26743",
        deathRegistrationPlace: "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
      }),
    );

    await waitFor(() =>
      expect(preview()).toHaveTextContent(
        "Ông/bà Nguyễn Văn A chết ngày 05/11/2026 theo giấy chứng tử do UBND phường Bến Thành, Thành phố Hồ Chí Minh đăng ký khai tử ngày 07/11/2026",
      ),
    );
  });

  it("lỗi 400 của Backend gắn đúng ô theo tên trường", async () => {
    mockCatalog();
    vi.spyOn(apiClient, "put").mockRejectedValue(
      badRequest({
        dateOfDeath: ["Ngày mất phải sau ngày Chủ kho kích hoạt kế hoạch (10/11/2026)."],
      }),
    );
    renderEditor(caseRecord());

    fireEvent.change(deathInput(), { target: { value: "2026-11-05" } });
    fireEvent.blur(deathInput());

    const message = await screen.findByText(
      "Ngày mất phải sau ngày Chủ kho kích hoạt kế hoạch (10/11/2026).",
    );
    expect(message.id).toBe(`${deathInput().id}-error`);
    expect(deathInput()).toHaveAttribute("aria-invalid", "true");
    expect(deathInput()).toHaveAttribute("aria-describedby", message.id);
  });
});

describe("nút Nộp hồ sơ", () => {
  it("khóa tới khi đủ tệp, đủ 3 thông tin và đã cam đoan; dòng nhắc nói còn thiếu gì", async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderEditor(caseRecord());

    expect(submitButton()).toBeDisabled();
    expect(
      screen.getByText(
        "Còn thiếu: giấy chứng tử / trích lục khai tử, ngày mất, ngày đăng ký khai tử, nơi đăng ký khai tử.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Tôi cam đoan/ }));
    expect(submitButton()).toBeDisabled();
  });

  it("thiếu đúng nơi đăng ký thì dòng nhắc chỉ nói nơi đăng ký", async () => {
    mockCatalog();
    renderEditor(caseRecord({ withFile: true, dateOfDeath: "2026-11-05", issuedOn: "2026-11-07" }));

    expect(screen.getByText("Còn thiếu: nơi đăng ký khai tử.")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("mở khi đủ tệp + 3 thông tin hợp lệ đã lưu + đã cam đoan", async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderEditor(
      caseRecord({
        withFile: true,
        dateOfDeath: "2026-11-05",
        issuedOn: "2026-11-07",
        deathRegistrationProvinceCode: "79",
        deathRegistrationWardCode: "26743",
        deathRegistrationPlace: "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
      }),
    );

    expect(submitButton()).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /Tôi cam đoan/ }));
    expect(submitButton()).toBeEnabled();
    expect(screen.queryByText(/Còn thiếu/)).not.toBeInTheDocument();
  });

  it("có ô báo đỏ thì khóa lại và nhắc sửa ô báo đỏ", async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderEditor(
      caseRecord({
        withFile: true,
        dateOfDeath: "2026-11-05",
        issuedOn: "2026-11-07",
        deathRegistrationProvinceCode: "79",
        deathRegistrationWardCode: "26743",
      }),
    );
    await user.click(screen.getByRole("checkbox", { name: /Tôi cam đoan/ }));
    expect(submitButton()).toBeEnabled();

    fireEvent.change(issuedInput(), { target: { value: "2026-11-04" } });

    expect(await screen.findByText("Sửa ô báo đỏ trước khi nộp.")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });
});

describe("bản đã gửi", () => {
  it("chỉ xem 3 thông tin, không có ô sửa", async () => {
    mockCatalog();
    renderEditor(
      caseRecord({
        isDraft: false,
        withFile: true,
        dateOfDeath: "2026-11-05",
        issuedOn: "2026-11-07",
        deathRegistrationProvinceCode: "79",
        deathRegistrationWardCode: "26743",
        deathRegistrationPlace: "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
      }),
    );

    expect(screen.getByText("05/11/2026")).toBeInTheDocument();
    expect(screen.getByText("07/11/2026")).toBeInTheDocument();
    expect(screen.getByText("UBND phường Bến Thành, Thành phố Hồ Chí Minh")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ngày mất")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tỉnh / thành phố")).not.toBeInTheDocument();
  });
});
