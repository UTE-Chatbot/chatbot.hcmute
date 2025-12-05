from app.services.rag_service.component.prompt import TABLE_DESCRIPTION_PROMPT
import re
from typing import List, Dict, Optional
from langchain_core.prompts import PromptTemplate
from app.services.rag_service.component.llms import get_cost_effective_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

class MarkdownTableExtractor:
    TABLE_PATTERN = re.compile(
        r'(?:\|.*\|\n)+\|[-\s|]+\|\n(?:\|.*\|\n?)*',
        re.MULTILINE
    )
    
    def __init__(self, row_threshold: int = 50, context_range: int = 200):
        self.row_threshold = row_threshold
        self.context_range = context_range
    
    def extract_tables(self, markdown_text: str) -> List[Dict]:
        tables = []
        for match in self.TABLE_PATTERN.finditer(markdown_text):
            start, end = match.span()
            if tables and start - tables[-1]['end'] <= 2:
                tables[-1]['end'] = end
            else:
                tables.append({'start': start, 'end': end})
        return tables
    
    def extract_large_tables(self, markdown_text: str) -> List[Dict]:
        tables = self.extract_tables(markdown_text)
        large_tables = []
        
        for table in tables:
            table_text = markdown_text[table['start']:table['end']]
            lines = table_text.strip().split("\n")
            
            data_rows = lines[2:] if len(lines) > 2 else []
            
            if len(data_rows) >= self.row_threshold:
                header = lines[0] if lines else ""
                
                context_start = max(0, table['start'] - self.context_range)
                context_end = min(len(markdown_text), table['end'] + self.context_range)
                context = markdown_text[context_start:context_end].strip()
                
                large_tables.append({
                    'header': header,
                    'table_text': table_text,
                    'context': context,
                    'start': table['start'],
                    'end': table['end'],
                    'row_count': len(data_rows)
                })
        
        return large_tables

class TableDescriptionGenerator:
   
    def __init__(
        self, 
        temperature: float = 0,
        custom_prompt: Optional[str] = None
    ):
        self.model = get_cost_effective_chat_model(temperature=temperature)
        self.prompt = PromptTemplate(
            input_variables=["document_name", "table_header", "table_context"],
            template=TABLE_DESCRIPTION_PROMPT
        )
    
    def generate_description(
        self, 
        table_info: Dict, 
        document_name: str,
        context_limit: int = 400
    ) -> str:
        prompt_text = self.prompt.format(
            document_name=document_name,
            table_header=table_info['header'],
            table_context=table_info['context'][:context_limit]
        )
        
        response = self.model.invoke(prompt_text)
        return response.content if hasattr(response, 'content') else str(response)

def process_and_replace_tables(
    markdown_text: str,
    document_name: str,
    document_url: str,
    row_threshold: int = 50,
    context_range: int = 200,
) -> str:

    extractor = MarkdownTableExtractor(row_threshold, context_range)
    large_tables = extractor.extract_large_tables(markdown_text)
    
    if not large_tables:
        return markdown_text
    
    generator = TableDescriptionGenerator()
    descriptions = []
    
    for table in large_tables:
        desc = generator.generate_description(table, document_name)
        descriptions.append(desc)
    
    merged_description = ", ".join(descriptions)
    markdown_link = f"[{merged_description}]({document_url})"
    
    processed_text = markdown_text
    sorted_tables = sorted(large_tables, key=lambda x: x['start'], reverse=True)
    
    for idx, table in enumerate(sorted_tables):
        start = table['start']
        end = table['end']
        
        is_first_table_in_original_text = (idx == len(sorted_tables) - 1)
        
        if is_first_table_in_original_text:
            processed_text = processed_text[:start] + markdown_link + processed_text[end:]
        else:
            processed_text = processed_text[:start] + "" + processed_text[end:]
            
    return processed_text