# Hướng dẫn chạy Pipeline Generation

Thư mục `research` chứa notebook `generate_pipelines.ipynb` giúp sinh câu trả lời với 3 cấu hình pipelines để các bạn dễ dàng đánh giá hoặc trích xuất dữ liệu:
1. **LLM ONLY**: Sử dụng LLM trực tiếp (không dùng tài liệu để trả lời).
2. **RAG ONLY**: Sử dụng RAG cơ bản không dùng kỹ thuật rerank hoặc truy vấn phụ.
3. **OUR RANK**: Sử dụng Pipeline nâng cao với RAG, Query Expansion, Jina Reranker và công cụ Text2SQL (cấu hình chuyên sâu).

## Môi trường chạy
1. Đảm bảo bạn đã kích hoạt môi trường conda của dự án:
   ```bash
   conda activate hcmute-chatbot
   ```
2. Đã tải đầy đủ environment variables trong `.env` tương tự `research/evaluation/.env` (đảm bảo có `OPENAI_API_KEY`, `JINA_API_KEY`, `QDRANT_URL`).

## Cách sử dụng Notebook

Mở tệp `generate_pipelines.ipynb` và thực hiện như sau:

- **Bước 1**: Đảm bảo Qdrant Vector Store đã được ingest dữ liệu (Ví dụ mặc định `human_chunks_hybrid`). Nếu chưa có, bạn cần chạy `ingest.ipynb` trước đó.
- **Bước 2**: Chỉnh sửa đường dẫn tới file bộ câu hỏi đầu vào ở mục cấu hình đường dẫn (Cell số 5):
  ```python
  dataset_path = "evaluation/dataset/evaluation.csv" # Mặc định
  output_path = "evaluation/output/pipeline_results.csv" # File đầu ra kết quả
  ```
  File đầu vào `dataset_path` CẦN có ít nhất một cột `question` (chứa các câu hỏi cần thực thi). Có thể có thêm cột `answer` (nếu đây là dataset ground truth).
- **Bước 3**: Chạy notebook (Run All). Notebook sẽ lần lượt gọi 3 pipeline trên để sinh câu trả lời cho toàn dữ liệu CSV của bạn.
- **Bước 4**: Nhận file Output cuối cùng là một file `.csv` mới tại thư mục `evaluation/output/`. File kết quả này sẽ có thêm các cột `generated_llm_only`, `generated_basic_rag`, `generated_our_rag` để so sánh trực quan.

## Statistical Methods

### Wilcoxon Signed-Rank Test
A **non-parametric paired test** comparing two pipelines on the same 150 questions. For each question, we compute the score difference between pipeline A and B, then test whether the median difference ≠ 0.

- **Why Wilcoxon?** Likert scores (1–5) are ordinal, not normally distributed → parametric t-tests are inappropriate.
- **Paired design**: Each question is answered by all 3 pipelines, so differences are computed per-question.
- Significance: `*` p < 0.05, `**` p < 0.01, `***` p < 0.001, `ns` = not significant.

### Intraclass Correlation Coefficient (ICC)
Measures **judge consistency** across 3 independent scoring runs of the same LLM-as-Judge.

- ICC ≥ 0.90 → excellent agreement (judge is reliable)
- ICC 0.75–0.90 → good agreement
- ICC 0.50–0.75 → moderate agreement
- ICC < 0.50 → poor agreement (judge scores are noisy)

We use ICC(1,1) — each run is an independent "rater" scoring all 450 items (150 questions × 3 pipelines).

### Component Contributions (Ablation)
The current 3-pipeline comparison shows **whether** our architecture improves over baselines, but **not which component** drives the improvement. The gap between Basic RAG and Our RAG is the combined effect of:

| Component | Basic RAG | Our RAG |
|---|---|---|
| Dense retrieval | ✓ | — |
| Hybrid retrieval (dense + BM25) | — | ✓ |
| Query expansion (3 variants) | — | ✓ |
| Reciprocal Rank Fusion | — | ✓ |
| Jina Reranker v3 | — | ✓ |
| Text2SQL (structured data) | — | ✓ |

To isolate individual contributions, an **ablation study** would add intermediate pipelines (e.g., "RAG + hybrid only", "RAG + hybrid + reranker"). This is left as future work unless added below.