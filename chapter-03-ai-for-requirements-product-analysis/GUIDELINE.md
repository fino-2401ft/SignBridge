# Chapter 3 — AI for Requirements & Product Analysis

> [!IMPORTANT]
> ⚠️ **PRD mẫu không phải kết quả duy nhất.** Nội dung thay đổi theo brief, context, câu trả lời về scope và quyết định review. Chỉ dùng docs mẫu để thấy mức độ cụ thể cần đạt, không sao chép như một công thức.

> [!TIP]
> 🧩 **Viết hành vi có thể kiểm chứng.** Dùng `$brainstorm` khi một lựa chọn làm đổi scope; dùng `$prd-generator` khi đã đủ quyết định để cấu trúc yêu cầu. Đừng để skill tự thêm feature không có nguồn.

## Start here

Bạn có project brief và project context đã được chấp nhận. Mục tiêu là tạo PRD có scope rõ, review nó, rồi chi tiết hóa hành vi cho design và engineering.

## Recommended path

1. **PRIMARY — P3.1:** tạo draft PRD bằng [create-product-requirements.prompt.md](prompts/create-product-requirements.prompt.md).
2. **REVIEW GATE — P3.2:** chạy [review-product-requirements.prompt.md](prompts/review-product-requirements.prompt.md); accept, reject hoặc defer từng finding.
3. Chỉ khi PRD đã được approve, chạy **PRIMARY — P3.3** [create-feature-specification.prompt.md](prompts/create-feature-specification.prompt.md).
4. **REVIEW GATE:** approve flow success, failure, recovery, persistence và authorization.

## Input package

- [Project brief](../chapter-01-ai-in-software-engineering/docs/project-brief.md).
- [Project context](../chapter-02-prompt-engineering/docs/project-context.md).
- Human decisions mới hơn hai artifact này.

## Review gate

PRD đạt khi mỗi requirement có value, boundary và acceptance criteria quan sát được. Feature specification đạt khi designer và developer không phải đoán hành vi cốt lõi. Nếu P3.2 nêu finding đã xác nhận, sửa PRD trước khi sang P3.3.

## Handoff

Giữ [product-requirements.md](docs/product-requirements.md) và [feature-specification.md](docs/feature-specification.md) ở trạng thái `Accepted`. Đính kèm cả hai cho design; không giao task breakdown ở stage này.

## Prompt reference

### P3.1 — PRIMARY — Create product requirements

- Skills: `$prd-generator` (required), `$brainstorm` (conditional)
- Interaction: plan-then-approve
- Output: draft rồi approved PRD

### P3.2 — REVIEW GATE — Review product requirements

- Skills: `$prd-generator` (required), `$brainstorm` (conditional)
- Interaction: inspect-and-report
- Output: findings để cập nhật PRD, không phải canonical docs mới

### P3.3 — PRIMARY — Create feature specification

- Skills: `$prd-generator` (required), `$brainstorm` (conditional)
- Interaction: plan-then-approve
- Output: approved feature specification

## Raw prompt and learning notes

Raw prompt: “Viết hết requirements cho Kanban app.” Prompt này thường tạo scope lớn và trộn product với implementation. Hãy tách bước tạo PRD, bước review và bước chi tiết behavior để mỗi decision có một review gate.
