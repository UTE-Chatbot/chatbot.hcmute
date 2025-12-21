import streamlit as st
import pandas as pd
import os

# Page config
st.set_page_config(
    page_title="Công cụ Gán nhãn Đánh giá", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# File paths
CORPUS_FILE = "corpus.csv"
EVAL_FILE = "evaluation.csv"
ANNOTATED_FILE = "annotated_evaluation.csv"

@st.cache_data
def load_corpus():
    """Load corpus data"""
    try:
        df = pd.read_csv(CORPUS_FILE)
        # Ensure id is integer
        df['id'] = df['id'].astype(int)
        return df
    except Exception as e:
        st.error(f"Lỗi khi tải corpus: {e}")
        return None

def load_evaluation_data(annotated=False):
    """Load evaluation or annotated data"""
    try:
        if annotated and os.path.exists(ANNOTATED_FILE):
            df = pd.read_csv(ANNOTATED_FILE, usecols=['question', 'answer', 'relevant_doc_ids'])
        else:
            df = pd.read_csv(EVAL_FILE, usecols=['question', 'answer', 'relevant_doc_ids'])
        
        if 'relevant_doc_ids' not in df.columns:
            df['relevant_doc_ids'] = ''
        else:
            df['relevant_doc_ids'] = df['relevant_doc_ids'].fillna('').astype(str)
        
        return df
    except Exception as e:
        st.error(f"Lỗi khi tải dữ liệu đánh giá: {e}")
        return None

def save_annotation(data, idx, doc_ids):
    """Save annotation for current question"""
    if data is not None:
        # Convert list of doc_ids to comma-separated string (integers only)
        doc_ids_str = ','.join(str(int(x)) for x in doc_ids) if doc_ids else ''
        data.at[idx, 'relevant_doc_ids'] = doc_ids_str
        data.to_csv(ANNOTATED_FILE, index=False)
        return True
    return False

def parse_doc_ids(doc_ids_str):
    """Parse document IDs from string to list of integers"""
    if pd.isna(doc_ids_str) or doc_ids_str == '' or doc_ids_str == 'nan':
        return []
    try:
        return [int(float(x.strip())) for x in str(doc_ids_str).split(',') if x.strip() and x.strip() != 'nan']
    except:
        return []

# Document selection dialog
@st.dialog("📚 Chọn tài liệu liên quan", width="large")
def document_selection_dialog(corpus_df, current_selected):
    """Dialog for selecting relevant documents"""
    
    # Initialize temp selection state
    if 'temp_selected' not in st.session_state:
        st.session_state.temp_selected = current_selected.copy()
    
    # Search box
    search_term = st.text_input("🔍 Tìm kiếm tài liệu theo tên hoặc nội dung", key="dialog_search")
    
    # Filter corpus
    if search_term:
        mask = corpus_df['name'].str.contains(search_term, case=False, na=False) | \
               corpus_df['full_text'].str.contains(search_term, case=False, na=False)
        filtered_corpus = corpus_df[mask]
    else:
        filtered_corpus = corpus_df
    
    for _, row in filtered_corpus.iterrows():
        doc_id = int(row['id'])
        doc_name = str(row['name'])[:100]
        is_selected = doc_id in st.session_state.temp_selected
        
        col1, col2 = st.columns([0.05, 0.95])
        with col1:
            if st.checkbox(
                "Chọn",
                key=f"dialog_doc_{doc_id}",
                value=is_selected,
                label_visibility="collapsed"
            ):
                if doc_id not in st.session_state.temp_selected:
                    st.session_state.temp_selected.append(doc_id)
            else:
                if doc_id in st.session_state.temp_selected:
                    st.session_state.temp_selected.remove(doc_id)
        
        with col2:
            with st.expander(f"**[{doc_id}]** {doc_name}"):
                st.markdown(f"**Tên:** {row['name']}")
                st.markdown("**Nội dung:**")
                content = str(row['full_text'])
                st.text(content)
    
    st.markdown("---")
    
    # Confirm buttons
    col1, col2 = st.columns(2)
    with col1:
        if st.button("💾 Xác nhận chọn", type="primary", use_container_width=True):
            st.session_state.selected_docs = st.session_state.temp_selected.copy()
            del st.session_state.temp_selected
            st.rerun()
    with col2:
        if st.button("🚫 Hủy bỏ", use_container_width=True):
            del st.session_state.temp_selected
            st.rerun()

def main():
    st.title("📝 Công cụ Gán nhãn Câu hỏi Đánh giá")
    
    # Initialize session state
    if 'current_idx' not in st.session_state:
        st.session_state.current_idx = 0
    if 'selected_docs' not in st.session_state:
        st.session_state.selected_docs = []
    if 'last_idx' not in st.session_state:
        st.session_state.last_idx = -1
    
    # Sidebar
    st.sidebar.markdown("## 📂 Nguồn dữ liệu")
    
    has_annotated = os.path.exists(ANNOTATED_FILE)
    mode_options = ["📝 Gán nhãn mới (evaluation.csv)"]
    if has_annotated:
        mode_options.append("✏️ Chỉnh sửa (annotated_evaluation.csv)")
    
    selected_mode = st.sidebar.radio("Chọn nguồn dữ liệu:", mode_options, key="mode_radio")
    use_annotated = "Chỉnh sửa" in selected_mode and has_annotated
    
    if st.sidebar.button("🔄 Tải lại dữ liệu"):
        st.cache_data.clear()
        for key in ['data', 'current_mode', 'last_idx']:
            if key in st.session_state:
                del st.session_state[key]
        st.rerun()
    
    st.sidebar.markdown("---")
    
    # Load data
    corpus_df = load_corpus()
    
    if 'current_mode' not in st.session_state:
        st.session_state.current_mode = use_annotated
    
    if st.session_state.current_mode != use_annotated:
        st.session_state.current_mode = use_annotated
        if 'data' in st.session_state:
            del st.session_state['data']
        st.session_state.last_idx = -1
    
    if 'data' not in st.session_state:
        st.session_state.data = load_evaluation_data(annotated=use_annotated)
    
    eval_df = st.session_state.data
    
    if corpus_df is None or eval_df is None:
        st.error("❌ Không thể tải dữ liệu. Vui lòng kiểm tra đường dẫn file.")
        return
    
    # Navigation
    st.sidebar.markdown("## 🧭 Điều hướng")
    total_questions = len(eval_df)
    
    progress = (st.session_state.current_idx + 1) / total_questions
    st.sidebar.progress(progress)
    st.sidebar.markdown(f"**Câu hỏi {st.session_state.current_idx + 1} / {total_questions}**")
    
    jump_to = st.sidebar.number_input(
        "Chuyển đến câu hỏi:",
        min_value=1,
        max_value=total_questions,
        value=st.session_state.current_idx + 1,
        key="jump_input"
    )
    
    if st.sidebar.button("Đi đến"):
        st.session_state.current_idx = jump_to - 1
        st.session_state.last_idx = -1
        st.rerun()
    
    # Statistics
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 📊 Thống kê")
    annotated_count = sum(1 for x in eval_df['relevant_doc_ids'] if x and str(x) not in ['', 'nan'])
    st.sidebar.metric("Đã gán nhãn", f"{annotated_count} / {total_questions}")
    st.sidebar.metric("Tiến độ", f"{(annotated_count/total_questions)*100:.1f}%")
    
    if st.sidebar.button("💾 Lưu tất cả", type="primary"):
        eval_df.to_csv(ANNOTATED_FILE, index=False)
        st.sidebar.success("✅ Đã lưu!")
    
    st.markdown("---")
    
    # Main content
    current_row = eval_df.iloc[st.session_state.current_idx]
    
    # Load existing annotations
    if st.session_state.last_idx != st.session_state.current_idx:
        existing_doc_ids = parse_doc_ids(current_row['relevant_doc_ids'])
        st.session_state.selected_docs = existing_doc_ids
        st.session_state.last_idx = st.session_state.current_idx
    
    # Question and Answer
    col_q, col_a = st.columns(2)
    
    with col_q:
        st.markdown("### 📋 Câu hỏi")
        st.markdown(f"**Số thứ tự:** {st.session_state.current_idx + 1}")
        question_text = str(current_row['question']) if pd.notna(current_row['question']) else "Không có câu hỏi"
        st.info(question_text)
    
    with col_a:
        st.markdown("### ✅ Câu trả lời mẫu")
        answer_text = str(current_row['answer']) if pd.notna(current_row['answer']) else "Không có câu trả lời"
        if len(answer_text) > 800:
            st.success(answer_text[:800] + "...")
            with st.expander("Xem toàn bộ câu trả lời"):
                st.write(answer_text)
        else:
            st.success(answer_text)
    
    st.markdown("---")
    
    # Selected documents section
    st.markdown("### 🔗 Tài liệu liên quan đã chọn")
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        if st.session_state.selected_docs:
            num_selected = len(st.session_state.selected_docs)
            st.markdown(f"**Số tài liệu đã chọn:** {num_selected}")
            
            # Show selected documents in expanders
            for doc_id in st.session_state.selected_docs:
                doc_row = corpus_df[corpus_df['id'] == doc_id]
                if not doc_row.empty:
                    doc_row = doc_row.iloc[0]
                    doc_name = str(doc_row['name'])[:80]
                    with st.expander(f"📄 [{doc_id}] {doc_name}..."):
                        st.markdown(f"**Tên:** {doc_row['name']}")
                        content = str(doc_row['full_text'])
                        st.text(content[:500] + "..." if len(content) > 500 else content)
        else:
            st.warning("⚠️ Chưa chọn tài liệu nào")
    
    with col2:
        # Open dialog button
        if st.button("📚 Chọn tài liệu", type="primary", use_container_width=True):
            st.session_state.temp_selected = st.session_state.selected_docs.copy()
            document_selection_dialog(corpus_df, st.session_state.selected_docs)
        
        if st.button("🗑️ Xóa tất cả", use_container_width=True):
            st.session_state.selected_docs = []
            st.rerun()
    
    st.markdown("---")
    
    # Navigation buttons
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        if st.button("⬅️ Trước", disabled=st.session_state.current_idx == 0, use_container_width=True):
            save_annotation(st.session_state.data, st.session_state.current_idx, st.session_state.selected_docs)
            st.session_state.current_idx -= 1
            st.session_state.last_idx = -1
            st.rerun()
    
    with col2:
        if st.button("💾 Lưu", type="primary", use_container_width=True):
            if save_annotation(st.session_state.data, st.session_state.current_idx, st.session_state.selected_docs):
                st.success(f"✅ Đã lưu câu {st.session_state.current_idx + 1}")
    
    with col3:
        if st.button("💾 Lưu & Tiếp", use_container_width=True):
            save_annotation(st.session_state.data, st.session_state.current_idx, st.session_state.selected_docs)
            if st.session_state.current_idx < total_questions - 1:
                st.session_state.current_idx += 1
                st.session_state.last_idx = -1
            st.rerun()
    
    with col4:
        if st.button("⏭️ Bỏ qua", use_container_width=True):
            if st.session_state.current_idx < total_questions - 1:
                st.session_state.current_idx += 1
                st.session_state.last_idx = -1
            st.rerun()
    
    with col5:
        if st.button("➡️ Tiếp", disabled=st.session_state.current_idx == total_questions - 1, use_container_width=True):
            save_annotation(st.session_state.data, st.session_state.current_idx, st.session_state.selected_docs)
            st.session_state.current_idx += 1
            st.session_state.last_idx = -1
            st.rerun()
    
if __name__ == "__main__":
    main()
