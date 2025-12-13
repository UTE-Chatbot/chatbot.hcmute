# CẢI THIỆN CHATBOT - TỰ NHIÊN VÀ LINH HOẠT

## Vấn đề đã khắc phục

### 1. **Không phải lúc nào cũng tra cứu dữ liệu**

- **Trước:** Hệ thống luôn cố gắng tra cứu tool cho mọi câu hỏi
- **Sau:** Phân loại câu hỏi thành 2 nhóm:
  - **Nhóm 1 (KHÔNG cần tra cứu):** Chào hỏi, cảm ơn, tạm biệt, tán gẫu chung chung
  - **Nhóm 2 (CẦN tra cứu):** Câu hỏi có nội dung cụ thể về tuyển sinh

### 2. **Lan man và hỏi lại người dùng**

- **Trước:** Thường kết thúc bằng "Bạn cần mình giúp gì nữa?"
- **Sau:**
  - Trả lời ngắn gọn, đúng trọng tâm
  - KHÔNG lan man, KHÔNG hỏi lại
  - Kết thúc tự nhiên

### 3. **Rập khuôn khi không có dữ liệu**

- **Trước:** Luôn nói "Xin lỗi, hiện tại..."
- **Sau:** Linh hoạt dựa trên loại câu hỏi:
  - **Câu hỏi chung (chào hỏi, hỏi thăm):** Trả lời tự nhiên
  - **Câu hỏi cụ thể nhưng thiếu dữ liệu:** "Mình chưa có thông tin này, bạn có thể liên hệ phòng Tuyển sinh để được hỗ trợ trực tiếp."

## Thay đổi chi tiết

### File: `backend/app/services/rag_service/component/prompt.py`

#### 1. `RETRIEVE_INFORMATION_WITH_TOOLS_PROMPT`

```python
# PHÂN LOẠI CÂU HỎI
## Nhóm 1: KHÔNG CẦN TRA CỨU DỮ LIỆU
- Chào hỏi: "Xin chào", "Hi", "Hello", "Chào bạn"
- Cảm ơn: "Cảm ơn", "Thank you", "Thanks"
- Tạm biệt: "Tạm biệt", "Bye", "See you"
- Tán gẫu chung chung không liên quan tuyển sinh

## Nhóm 2: CẦN TRA CỨU DỮ LIỆU
- text2sql_tool: số liệu, dữ liệu định lượng
- document_search_tool: mô tả ngành, quy trình, quy chế, etc.

# HƯỚNG DẪN
1. Nếu câu hỏi thuộc Nhóm 1 → KHÔNG gọi tool
2. Nếu câu hỏi thuộc Nhóm 2 → Gọi 1 hoặc nhiều tool phù hợp
3. Nếu không chắc → KHÔNG gọi tool
```

#### 2. `GENERATE_RESPONSE_PROMPT_ADMISSION_CHATBOT`

```python
# NGUYÊN TẮC TRẢ LỜI
1. Tự nhiên & Linh hoạt:
   - Chào hỏi/cảm ơn/tạm biệt → Ngắn gọn, thân thiện
   - Có dữ liệu → Chính xác dựa trên dữ liệu
   - KHÔNG có dữ liệu:
     + Câu hỏi chung → Trả lời tự nhiên
     + Câu hỏi cụ thể → "Mình chưa có thông tin này..."

2. Ngắn gọn & Đúng trọng tâm:
   - Trả lời trực tiếp
   - KHÔNG lan man
   - KHÔNG hỏi lại "Bạn cần gì"

3. Định dạng:
   - Bảng Markdown cho danh sách
   - LaTeX cho công thức
   - In đậm từ khóa
```

### File: `backend/app/services/rag_service/core/graph.py`

#### Thêm summary vào generate_response

- Thêm context hội thoại (summary) vào prompt để chatbot hiểu được ngữ cảnh
- Giúp trả lời tự nhiên hơn dựa trên cuộc trò chuyện trước đó

## Kết quả mong đợi

### Ví dụ cải thiện:

#### Trường hợp 1: Chào hỏi

**Input:** "Xin chào"

- **Trước:** Tìm kiếm trong database → "Xin chào! Bạn cần mình giúp gì về tuyển sinh không?"
- **Sau:** "Chào bạn! Mình có thể giúp gì cho bạn?" (không tra cứu tool)

#### Trường hợp 2: Có dữ liệu

**Input:** "Điểm chuẩn ngành CNTT 2024 là bao nhiêu?"

- **Trước:** Tra cứu → hiển thị bảng + "Bạn cần gì thêm không?"
- **Sau:** Tra cứu → hiển thị bảng (kết thúc tự nhiên)

#### Trường hợp 3: Không có dữ liệu + câu hỏi cụ thể

**Input:** "Email của trưởng khoa CNTT là gì?"

- **Trước:** "Xin lỗi, hiện tại mình chưa có thông tin về email..."
- **Sau:** "Mình chưa có thông tin này, bạn có thể liên hệ phòng Tuyển sinh để được hỗ trợ trực tiếp."

#### Trường hợp 4: Không có dữ liệu + câu hỏi chung

**Input:** "Bạn có khỏe không?"

- **Trước:** Tra cứu failed → "Xin lỗi, hiện tại..."
- **Sau:** "Mình khỏe, cảm ơn bạn! Bạn muốn biết thông tin gì về tuyển sinh?" (không tra cứu)

## Cách test

1. Test chào hỏi: "Hi", "Xin chào", "Hello"
2. Test cảm ơn: "Cảm ơn", "Thanks"
3. Test tạm biệt: "Tạm biệt", "Bye"
4. Test câu hỏi có dữ liệu: "Điểm chuẩn ngành CNTT?"
5. Test câu hỏi không có dữ liệu nhưng cụ thể: "Email trưởng khoa?"
6. Test tán gẫu: "Bạn có khỏe không?", "Hôm nay thế nào?"

## Lợi ích

✅ Nhanh hơn (không tra cứu khi không cần)
✅ Tự nhiên hơn (trả lời phù hợp với từng loại câu hỏi)
✅ Chính xác hơn (dựa trên dữ liệu thực)
✅ Gọn gàng hơn (không lan man)
✅ Đúng trọng tâm hơn (không hỏi lại vô ích)
