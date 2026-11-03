import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerPeopleGuide } from "@/widgets/OwnerWorkspace/OwnerPeopleGuide";

/** Hướng dẫn cho Chủ kho: người nhận (thụ hưởng) và người thực hiện (thực thi) làm gì, được làm gì. */
export function PeopleGuidePage() {
  return (
    <OwnerWorkspace
      title="Hướng dẫn bàn giao"
      description="Mỗi người làm gì và các bước bàn giao diễn ra thế nào."
    >
      <OwnerPeopleGuide />
    </OwnerWorkspace>
  );
}
