import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    filename = os.path.basename(file_path)
    is_dashboard = filename == 'Dash Board.md'

    new_lines = []
    
    current_row_cols = []
    current_col_content = []
    in_row = False
    in_col = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check for row/col tags
        if stripped == ':::row':
            in_row = True
            current_row_cols = []
            continue
        
        if stripped.startswith(':::col'):
            in_col = True
            current_col_content = []
            continue
            
        if stripped == ':::':
            if in_col:
                in_col = False
                current_row_cols.append('\n'.join(current_col_content))
                current_col_content = []
            elif in_row:
                in_row = False
                # Process the row
                if not current_row_cols:
                    # Row had no columns? Just add nothing.
                    pass
                elif len(current_row_cols) == 2 and not is_dashboard:
                    # Bilingual pattern
                    col1 = current_row_cols[0].strip()
                    col2 = current_row_cols[1].strip()
                    col2_indented = '\n'.join(['> ' + l for l in col2.split('\n')])
                    new_lines.append(f"{col1}\n\n{col2_indented}\n\n")
                else:
                    # Stack columns
                    for col in current_row_cols:
                        new_lines.append(col.strip() + '\n\n')
            continue
            
        if in_col:
            current_col_content.append(line.rstrip('\n'))
        elif in_row:
            # Lines between :::row and first :::col, or between :::col and :::row end
            # We usually ignore these or treat them as part of the structure
            pass
        else:
            # Outside row/col
            # Check for {bg:...} etc.
            if re.match(r'^\{(?:bg|color|align|space):[^\}]*\}\s*$', stripped):
                continue
            
            # Also handle inline {bg:...}
            line = re.sub(r'\{(?:bg|color|align|space):[^\}]*\}', '', line)
            if line.strip() or line == '\n':
                new_lines.append(line)

    # Final cleanup of any stray tags that might have been missed (e.g. if structure was broken)
    final_content = ''.join(new_lines)
    final_content = re.sub(r':::row\s*\n?', '', final_content)
    final_content = re.sub(r':::col(?:\s+\d+%)?\s*\n?', '', final_content)
    final_content = re.sub(r':::\s*\n?', '', final_content)
    # Remove any extra triple-newlines
    final_content = re.sub(r'\n{3,}', '\n\n', final_content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)

def main():
    base_dir = r'E:\portfoliope\public\cases'
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.md'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
