import os, sys, csv, asyncio, random
import duckdb
import pandas as pd
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv("/home/sysadmin/hcmute-chatbot/research/evaluation/.env")
sys.path.append("/home/sysadmin/hcmute-chatbot/backend")

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.chat_models import init_chat_model

CSV_URL = "https://api-chatbot.hcmute.edu.vn/api/v1/files/raw/63d4cd6d-671f-4904-b8d5-2eff3259267c-diem_chuan.csv"
OUTPUT_PATH = "/home/sysadmin/hcmute-chatbot/research/evaluation/dataset/generated_dataset.csv"
TARGET_COUNT = 150
MAX_RETRIES = 20


class QAPair(BaseModel):
    question: str = Field(description="Natural Vietnamese student question.")
    ground_truth_answer: str = Field(description="Neutral, correct answer.")
    complexity: str = Field(description="easy, medium, or hard")


class QABatch(BaseModel):
    items: list[QAPair]


def get_llm(temperature=0.7):
    return init_chat_model(
        model="gpt-4o-mini",
        temperature=temperature,
        model_provider="openai",
        openai_api_key=os.getenv("OPENAI_API_KEY"),
    )


def load_data():
    df = pd.read_csv(CSV_URL)
    return df


def build_data_scenarios(df):
    scenarios = []
    nganh_list = df["ten_nganh"].unique().tolist()
    khoa_list = df["khoa"].unique().tolist()
    years = sorted(df["nam"].unique().tolist())

    for _ in range(100):
        row = df.sample(1).iloc[0]
        scenarios.append({
            "type": "single_lookup",
            "data": f"ten_nganh={row['ten_nganh']}, nam={row['nam']}, diem={row['diem']}, khoa={row['khoa']}",
        })

    for _ in range(50):
        nganh = random.choice(nganh_list)
        rows = df[df["ten_nganh"] == nganh].sort_values("nam")
        if len(rows) >= 2:
            data_str = rows[["ten_nganh", "nam", "diem"]].to_string(index=False)
            scenarios.append({
                "type": "comparison_over_years",
                "data": data_str,
            })

    for _ in range(40):
        khoa = random.choice(khoa_list)
        year = random.choice(years)
        rows = df[(df["khoa"] == khoa) & (df["nam"] == year)]
        if len(rows) >= 2:
            data_str = rows[["ten_nganh", "diem", "khoa"]].to_string(index=False)
            scenarios.append({
                "type": "khoa_query",
                "data": f"khoa={khoa}, nam={year}\n{data_str}",
            })

    for _ in range(30):
        year = random.choice(years)
        threshold = random.choice([20, 22, 24, 25, 26])
        rows = df[(df["nam"] == year) & (df["diem"] >= threshold)].sort_values("diem", ascending=False).head(10)
        if len(rows) >= 3:
            data_str = rows[["ten_nganh", "diem"]].to_string(index=False)
            scenarios.append({
                "type": "ranking_or_filter",
                "data": f"nam={year}, diem>={threshold}\n{data_str}",
            })

    for _ in range(30):
        year = random.choice(years)
        top_rows = df[df["nam"] == year].nlargest(5, "diem")[["ten_nganh", "diem"]]
        bot_rows = df[df["nam"] == year].nsmallest(5, "diem")[["ten_nganh", "diem"]]
        data_str = f"TOP:\n{top_rows.to_string(index=False)}\nBOTTOM:\n{bot_rows.to_string(index=False)}"
        scenarios.append({
            "type": "trend_analysis",
            "data": f"nam={year}\n{data_str}",
        })

    random.shuffle(scenarios)
    return scenarios


QUESTION_STYLE_GUIDE = """
You MUST write questions exactly as a real Vietnamese student would type into a chatbot. However, the questions MUST use correct Vietnamese spelling with FULL diacritics (dấu).

STYLE RULES:
1. Mix these tones naturally:
   - Casual: "cho em hỏi", "vậy ạ", "được không ạ", "nha"
   - Polite: "em muốn biết", "anh/chị ơi cho em hỏi"
   - Direct: "điểm chuẩn CNTT là bao nhiêu?", "ngành nào điểm thấp nhất?"
2. ALWAYS use proper Vietnamese diacritics (dấu). DO NOT write without accents.
3. Use abbreviations students actually use: CNTT, IT, ATTT, KTPM, AI, IoT, XD, KT
4. Vary structure: question marks, "có...không", "là bao nhiêu", "giúp em", "như thế nào"
5. Include filler words: "ạ", "vậy", "nhỉ", "thế"
6. NEVER repeat the same sentence pattern. Each question must feel unique.
7. NEVER use formal/robotic phrasing like "Điểm chuẩn ngành X năm Y là bao nhiêu?"

ANSWER RULES:
1. Neutral, factual, concise.
2. Write full major names. Use "chuong trinh tieng Viet/Anh" instead of "CTDT".
3. Bullet points for multiple items, single sentence for single values.
4. No commentary, no suggestions, no follow-up questions, no greeting.
"""


async def generate_batch(llm, scenarios_batch, existing_questions):
    parser = PydanticOutputParser(pydantic_object=QABatch)
    existing_str = "\n".join(f"- {q}" for q in existing_questions[-20:]) if existing_questions else "None"

    scenarios_str = ""
    for i, s in enumerate(scenarios_batch):
        scenarios_str += f"\n--- Scenario {i+1} ({s['type']}) ---\n{s['data']}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You create evaluation Q&A pairs for HCMUTE admission chatbot.
For each scenario below, write ONE question-answer pair.

{style_guide}

IMPORTANT:
- The question should be what a student would naturally ask to get this data.
- The answer must use ONLY the data provided - do not invent data.
- Complexity: single_lookup = "easy", comparison_over_years/khoa_query = "medium", ranking_or_filter/trend_analysis = "hard"

DO NOT repeat these existing questions:
{existing}

Scenarios:
{scenarios}"""),
        ("user", "Generate Q&A pairs for all {count} scenarios.\n{format_instructions}")
    ])

    chain = prompt | llm | parser
    result = await chain.ainvoke({
        "style_guide": QUESTION_STYLE_GUIDE,
        "existing": existing_str,
        "scenarios": scenarios_str,
        "count": str(len(scenarios_batch)),
        "format_instructions": parser.get_format_instructions(),
    })
    return result.items


def validate_answer(answer):
    bad_patterns = [
        "khong co san", "khong co du lieu", "khong tim thay",
        "Nganh 1", "Nganh 2", "Chi tieu 1", "Chi tieu 2",
        "khong co thong tin", "hien chua co",
    ]
    lower_no_space = answer.lower().replace(" ", "")
    for p in bad_patterns:
        if p.lower().replace(" ", "") in lower_no_space:
            return False
    if not answer or len(answer) < 10:
        return False
    return True


async def main():
    print("Loading data...")
    df = load_data()
    print(f"  {len(df)} rows loaded.")

    print("Building data scenarios...")
    scenarios = build_data_scenarios(df)
    print(f"  {len(scenarios)} scenarios created.")

    llm = get_llm(temperature=0.7)
    valid_rows = []
    existing_questions = []
    batch_size = 15
    attempt = 0

    i = 0
    while len(valid_rows) < TARGET_COUNT and attempt < MAX_RETRIES:
        attempt += 1

        if i >= len(scenarios):
            print("  Regenerating scenarios...")
            scenarios = build_data_scenarios(df)
            i = 0

        batch = scenarios[i:i + batch_size]
        i += batch_size

        print(f"\n--- Batch {attempt}: processing {len(batch)} scenarios ({len(valid_rows)}/{TARGET_COUNT}) ---")

        try:
            items = await generate_batch(llm, batch, existing_questions)
        except Exception as e:
            print(f"  Generation failed: {e}")
            continue

        print(f"  Got {len(items)} Q&A pairs. Validating...")

        for qa in items:
            if len(valid_rows) >= TARGET_COUNT:
                break
            if qa.question in existing_questions:
                print(f"  SKIP (duplicate)")
                continue
            if not validate_answer(qa.ground_truth_answer):
                print(f"  SKIP (bad answer): {qa.question[:60]}")
                continue

            existing_questions.append(qa.question)
            valid_rows.append({
                "question": qa.question,
                "ground_truth_answer": qa.ground_truth_answer,
                "complexity": qa.complexity,
            })
            print(f"  [{len(valid_rows)}/{TARGET_COUNT}] {qa.question[:70]}")

    with open(OUTPUT_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["question", "ground_truth_answer", "complexity"])
        writer.writeheader()
        writer.writerows(valid_rows)

    print(f"\nDone! Saved {len(valid_rows)} clean rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
