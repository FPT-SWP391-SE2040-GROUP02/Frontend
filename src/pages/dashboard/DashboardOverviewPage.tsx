import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";

// Import các components chuyên biệt của LegacyVault
import { DmsHeartbeatWidget } from "@/features/dms-heartbeat/ui/DmsHeartbeatWidget";
import { IntegritySealCard } from "@/features/dms-heartbeat/ui/IntegritySealCard";
import { LegalStepper } from "@/shared/ui/LegalStepper";
import { PrivateKeyViewer } from "@/entities/asset/ui/PrivateKeyViewer";
import { SeedPhraseGrid } from "@/entities/asset/ui/SeedPhraseGrid";
import { DeathCertDropzone } from "@/features/claim-verification/ui/DeathCertDropzone";
import { WebcamAffidavitModal } from "@/features/video-affidavit/ui/WebcamAffidavitModal";
import { LegalComplianceAlert } from "@/features/estate-allocation/ui/LegalComplianceAlert";
import { ShieldCheck, Lock, Landmark, Users, Clock, FileText } from "lucide-react";

/**
 * @description Màn hình Quản trị Di sản số & Cấu hình Di chúc thông minh (LegacyVault - Smart Testament).
 * Tích hợp toàn bộ hệ thống UI Components: DMS Pulse, Khóa bí mật, Thừa kế Điều 644 BLDS, Video minh mẫn Điều 630 BLDS.
 */
export function DashboardOverviewPage() {
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [isDropzoneOpen, setIsDropzoneOpen] = useState<boolean>(false);
  const [hasAgreedCompliance, setHasAgreedCompliance] = useState<boolean>(false);

  // Dữ liệu mẫu danh mục tài sản di sản
  const estateAssets = [
    {
      id: "AST-01",
      name: "Crypto Cold Storage Vault",
      category: "Digital Assets · Multi-Sig Ledger",
      heir: "Alexander von Berg",
      percentage: "70%",
      testament:
        "Tài sản này dành cho việc học đại học và quỹ bảo tồn truyền thống gia đình. Hãy sử dụng cẩn trọng và nắm giữ dài hạn.",
      condition: "E-KYC + Zurich Notary Chamber Approval",
      status: "Đã niêm phong",
    },
    {
      id: "AST-02",
      name: "Bản quyền Sở hữu Trí tuệ (Patent AI #892)",
      category: "Intellectual Property · Smart Contract",
      heir: "Victoria von Berg",
      percentage: "30%",
      testament: "Toàn bộ tiền bản quyền nhượng quyền thương mại công nghệ hàng năm.",
      condition: "Xác nhận Giấy chứng tử số + Chữ ký Executor",
      status: "Chờ đối soát",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto pb-12">
      {/* 1. Header Trang & Hành Động Ký Số */}
      <PageHeader
        title="Quản Trị Di Chúc Số & Két Sắt Di Sản"
        description="Cấu hình quy tắc chuyển giao tài sản tự động, nhịp tim sinh tồn DMS và đối soát công chứng."
        actions={
          <div className="flex gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDropzoneOpen(!isDropzoneOpen)}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              {isDropzoneOpen ? "Đóng Dropzone" : "Scan Giấy chứng tử"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsWebcamOpen(true)}
              className="gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              <span>🎥</span> Tuyên thệ minh mẫn (15s)
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-[var(--heritage-gold,#b88e4c)] hover:bg-[var(--heritage-gold-hover,#a07839)] text-white shadow-sm"
              onClick={() => alert("Đã ký số và niêm phong Smart Will vào sổ cái!")}
            >
              <Lock className="h-4 w-4" /> Ký số & Niêm phong
            </Button>
          </div>
        }
      />

      {/* 2. Quy trình 4 bước Legal Stepper */}
      <LegalStepper
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* 3. Thống kê tổng quan di sản */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted,#617369)]">
              Tổng giá trị di sản bảo vệ
            </CardTitle>
            <Landmark className="h-4 w-4 text-[var(--heritage-gold,#b88e4c)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[var(--heritage-gold,#d4af37)]">
              $14,850,000
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">● Đã mã hóa 256-Bit TLS</p>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted,#617369)]">
              Người thụ hưởng hợp pháp
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
              3 Người nhận
            </div>
            <p className="text-xs text-[var(--text-muted,#617369)] mt-1">100% tỷ lệ đã phân bổ</p>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted,#617369)]">
              Dead Man's Switch (DMS)
            </CardTitle>
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
              45 Ngày
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Heartbeat hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted,#617369)]">
              Công chứng & Pháp lý
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-[var(--heritage-gold,#b88e4c)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[var(--heritage-gold,#d4af37)]">
              Zurich Verified
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">Bảo chứng công chứng Thụy Sĩ</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Widget Nhịp tim sinh tồn DMS */}
      <DmsHeartbeatWidget
        daysRemaining={45}
        hoursRemaining={14}
        onCheckIn={async () => {
          alert("Nhịp tim sinh tồn đã được làm mới thêm 90 ngày!");
        }}
      />

      {/* 5. Vùng thả Giấy chứng tử số (Nếu được mở) */}
      {isDropzoneOpen && (
        <Card className="border-amber-200 dark:border-amber-800/60 bg-[#fdfcf9] dark:bg-[#121c16]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Vùng Tiếp Nhận Tài Liệu Pháp Lý & Giấy Chứng Tử Số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeathCertDropzone
              maxSizeMB={5}
              onFileSelect={(file) => {
                alert(`Đã nhận file: ${file.name}. Hệ thống đang tính mã băm SHA-256...`);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* 6. Bảng danh mục tài sản & Lời dặn di chúc */}
      <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs overflow-hidden">
        <CardHeader className="bg-[#fafcfa] dark:bg-[#0e241b] border-b border-[#e2e8e3] dark:border-[#1d3b2f] flex flex-row justify-between items-center py-4 px-6">
          <div>
            <CardTitle className="text-[17.5px] text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] font-semibold">
              Designated Asset Allocation
            </CardTitle>
            <p className="text-xs text-[var(--text-muted,#617369)] mt-0.5">
              Handover protocols execute automatically upon Dead-Man's Switch triggers and Legal E-KYC approval.
            </p>
          </div>
          <Badge variant="outline" className="bg-[#fbf7ee] dark:bg-[#1f1c13] text-[#7d5d28] dark:text-[#d4af37] border-[#e8dcc6] dark:border-[#423c28]">
            Sealed & Encrypted
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f6f9f6] dark:bg-[#0d221a]">
              <TableRow className="border-b border-[#e2e8e3] dark:border-[#1d3b2f]">
                <TableHead className="w-[30%] uppercase text-[11px] text-[var(--text-muted,#617369)] tracking-[0.7px]">Estate Asset & Beneficiary</TableHead>
                <TableHead className="w-[42%] uppercase text-[11px] text-[var(--text-muted,#617369)] tracking-[0.7px]">Testator's Direct Message</TableHead>
                <TableHead className="w-[28%] uppercase text-[11px] text-[var(--text-muted,#617369)] tracking-[0.7px]">Legal Handover Conditions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estateAssets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0f281f] border-b border-[#e2e8e3] dark:border-[#1d3b2f] transition-colors">
                  <TableCell className="align-top py-5 px-6">
                    <div className="font-semibold text-sm text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
                      {asset.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted,#617369)] mt-0.5">
                      {asset.category}
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-[var(--gold-light,#fbf7ee)] dark:bg-[#1a2b22] border border-[var(--gold-border,#e8dcc6)] dark:border-[#2d4d3d] text-[#7a5b27] dark:text-[var(--heritage-gold,#d4af37)] text-xs font-medium px-2.5 py-1 rounded-md">
                      <span>👤</span>
                      <span>Heir: {asset.heir} ({asset.percentage})</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-5 px-6">
                    <div className="instruction-text font-testament italic">
                      "{asset.testament}"
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-5 px-6">
                    <div className="condition-box">
                      <div className="font-semibold flex items-center gap-1.5 text-[var(--heritage-primary,#0b291e)] dark:text-[var(--heritage-gold,#d4af37)] mb-1 text-[12.5px]">
                        <span>🛡️</span> {asset.condition}
                      </div>
                      <span className="text-[11px] text-[var(--text-muted,#617369)]">
                        Trạng thái: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{asset.status}</strong>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 7. Két sắt bảo mật: Private Key & 12 Seed Words */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] flex items-center gap-1.5">
              <span>🔑</span> Khóa Bí Mật Két Sắt (Client-Side Encrypted)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PrivateKeyViewer
              privateKey="0x7f4b2a9c1e3d5f7a9b0c2e4f6a8d0b2c4e6f8a0b"
              label="Master Key Giải Mã Di Sản"
            />
            <IntegritySealCard
              manifestHash="8f4b2a9c1e3d5f7a9b0c2e4f6a8d0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e"
              statusLabel="TAMPER-PROOF"
            />
          </CardContent>
        </Card>

        <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] flex items-center gap-1.5">
              <span>📝</span> Lưới 12 Từ Khóa Khôi Phục (BIP-39 Seed Phrase)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeedPhraseGrid
              words={[
                "ocean",
                "vintage",
                "shield",
                "legacy",
                "glacier",
                "timber",
                "anchor",
                "orbit",
                "velvet",
                "harbor",
                "zenith",
                "crystal",
              ]}
              blurred={false}
            />
          </CardContent>
        </Card>
      </div>


      {/* 8. Hộp cảnh báo tuân thủ pháp luật (Điều 644 BLDS 2015) */}
      <LegalComplianceAlert
        isAcknowledged={hasAgreedCompliance}
        onAcknowledgeChange={(agreed) => setHasAgreedCompliance(agreed)}
      />

      {/* 9. Modal Webcam Tuyên Thệ 15s (Khi được bấm) */}
      {isWebcamOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <WebcamAffidavitModal
            isOpen={isWebcamOpen}
            onClose={() => setIsWebcamOpen(false)}
            onRecordingComplete={(blob) => {
              alert(`Quay hoàn tất video minh mẫn (${Math.round(blob.size / 1024)} KB). Sẵn sàng băm SHA-256.`);
              setIsWebcamOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
