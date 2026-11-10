import { ExecutorDocuments } from "@/features/executor-document";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Biên Bản: điền Phần 1 về Chủ kho cho biên bản của người nhận và xem lại mọi biên bản. */
export function ExecutorDocumentsPage() {
  return (
    <ExecutorWorkspace
      title="Biên Bản"
      description="Điền thông tin về Chủ kho cho biên bản của người nhận, ký, và xem lại mọi biên bản của kho."
    >
      <ExecutorDocuments />
    </ExecutorWorkspace>
  );
}
